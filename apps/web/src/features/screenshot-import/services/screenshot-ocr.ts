import type { ScreenshotOcrResult } from '@poe-crafter/shared-types';
import { env } from '@/shared/config';
import { validateScreenshot } from '../model/image-validation';

export interface ScreenshotOcrOptions {
  apiUrl?: string;
  fetchImpl?: typeof fetch;
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
  { apiUrl = env.apiUrl, fetchImpl = fetch }: ScreenshotOcrOptions = {},
): Promise<ScreenshotOcrResult> {
  const validationError = validateScreenshot(file);
  if (validationError) throw new Error(validationError.message);

  if (!apiUrl && !env.isProduction) {
    return {
      text: 'New Item\nDivine Crown\nItemLevel: 86\nLevelReq: 84\nPrefix: IncreasedLife9',
      processedAt: new Date().toISOString(),
    };
  }
  if (!apiUrl) throw new Error('O endpoint de OCR não está configurado.');

  const response = await fetchImpl(endpointFrom(apiUrl), {
    method: 'POST',
    headers: {
      'content-type': file.type,
      'x-file-name': file.name,
    },
    body: file,
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
}
