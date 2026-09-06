import type { ScreenshotOcrRequest, ScreenshotOcrResult } from '@poe-crafter/shared-types';
import { env } from '@/shared/config';
import { getDefaultAuthGateway, type AuthGateway } from '@/features/identity';
import { validateScreenshot } from '../model/image-validation';
import {
  createScreenshotStorageGateway,
  type ScreenshotStorageGateway,
} from './screenshot-storage';

export interface ScreenshotOcrOptions {
  apiUrl?: string;
  fetchImpl?: typeof fetch;
  authGateway?: AuthGateway;
  storageGateway?: ScreenshotStorageGateway;
  onProgress?: (stage: 'uploading' | 'processing', progress?: number) => void;
}

function endpointFrom(apiUrl: string) {
  return `${apiUrl.replace(/\/$/, '')}/screenshot-ocr`;
}

function isResult(value: unknown): value is ScreenshotOcrResult {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as { text?: unknown; processedAt?: unknown };
  return (
    typeof candidate.text === 'string' &&
    candidate.text.trim() !== '' &&
    typeof candidate.processedAt === 'string'
  );
}

export async function submitScreenshot(
  file: File,
  {
    apiUrl = env.apiUrl,
    fetchImpl = fetch,
    authGateway,
    storageGateway,
    onProgress,
  }: ScreenshotOcrOptions = {},
): Promise<ScreenshotOcrResult> {
  const validationError = validateScreenshot(file);
  if (validationError) throw new Error(validationError.message);

  if (env.authFixture || (!apiUrl && !env.isProduction)) {
    onProgress?.('uploading', 1);
    onProgress?.('processing');
    return {
      text: 'New Item\nDivine Crown\nItemLevel: 86\nLevelReq: 84\nPrefix: IncreasedLife9',
      processedAt: new Date().toISOString(),
    };
  }
  if (!apiUrl) throw new Error('O endpoint de OCR não está configurado.');

  const resolvedAuthGateway = authGateway ?? getDefaultAuthGateway();
  const gateway = storageGateway ?? createScreenshotStorageGateway(resolvedAuthGateway);
  let upload: { storagePath: string; uploadId: string } | undefined;
  try {
    onProgress?.('uploading', 0);
    upload = await gateway.upload(file, (progress) => onProgress?.('uploading', progress));
    onProgress?.('processing');
    const request: ScreenshotOcrRequest = {
      storagePath: upload.storagePath,
      requestId: upload.uploadId,
    };
    const response = await fetchImpl(endpointFrom(apiUrl), {
      method: 'POST',
      headers: {
        authorization: `Bearer ${await resolvedAuthGateway.getIdToken()}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(request),
    });
    const payload: unknown = await response.json();
    if (!response.ok) {
      const message =
        typeof payload === 'object' && payload !== null && 'message' in payload
          ? String(payload.message)
          : `O OCR respondeu ${response.status}.`;
      throw new Error(message);
    }
    if (!isResult(payload)) throw new Error('O OCR retornou texto vazio ou dados inválidos.');
    return payload;
  } catch (error: unknown) {
    if (upload) await gateway.remove(upload.storagePath).catch(() => undefined);
    throw error;
  }
}
