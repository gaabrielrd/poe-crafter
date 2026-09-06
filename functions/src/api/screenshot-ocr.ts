import { ImageAnnotatorClient } from '@google-cloud/vision';
import { onRequest } from 'firebase-functions/v2/https';
import type { ScreenshotOcrRequest, ScreenshotOcrResult } from '@poe-crafter/shared-types';
import type { OperationalBudget } from '../services/operational-budget';

export const MAX_SCREENSHOT_BYTES = 8 * 1024 * 1024;
export const SCREENSHOT_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;

function storagePathForUid(storagePath: string, uid: string) {
  return new RegExp(`^screenshots/${uid}/[A-Za-z0-9_-]{12,64}$`).test(storagePath);
}

export interface ScreenshotObject {
  contentType: string;
  size: number;
  createdAt: string;
  download(): Promise<Buffer>;
  remove(): Promise<void>;
}

export interface ScreenshotStore {
  get(path: string): Promise<ScreenshotObject>;
  list(prefix: string): Promise<ReadonlyArray<ScreenshotObject & { path: string }>>;
}

export interface VisionGateway {
  extractText(image: Buffer): Promise<string>;
}

export interface OcrQuota {
  reserve(month: string, requestId: string): Promise<boolean>;
}

export interface ScreenshotProcessorDependencies {
  store: ScreenshotStore;
  vision: VisionGateway;
  quota: OcrQuota;
  costBudget?: OperationalBudget;
  now: () => Date;
}

export function validateScreenshotRequest(contentType: string, byteLength: number): string | null {
  if (!SCREENSHOT_MIME_TYPES.includes(contentType as (typeof SCREENSHOT_MIME_TYPES)[number])) {
    return 'Use PNG, JPEG ou WebP.';
  }
  if (byteLength <= 0) return 'O corpo da imagem está vazio.';
  if (byteLength > MAX_SCREENSHOT_BYTES) return 'A imagem deve ter no máximo 8 MB.';
  return null;
}

function hasImageSignature(contentType: string, image: Buffer) {
  if (contentType === 'image/png')
    return image.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (contentType === 'image/jpeg')
    return image.subarray(0, 3).equals(Buffer.from([255, 216, 255]));
  return (
    image.subarray(0, 4).toString('ascii') === 'RIFF' &&
    image.subarray(8, 12).toString('ascii') === 'WEBP'
  );
}

function requestBody(value: unknown): ScreenshotOcrRequest | null {
  if (typeof value !== 'object' || value === null) return null;
  const body = value as Partial<ScreenshotOcrRequest>;
  if (typeof body.storagePath !== 'string' || typeof body.requestId !== 'string') return null;
  return { storagePath: body.storagePath, requestId: body.requestId };
}

export async function processScreenshotRequest(
  input: ScreenshotOcrRequest & { uid: string },
  dependencies: ScreenshotProcessorDependencies,
): Promise<ScreenshotOcrResult> {
  if (!storagePathForUid(input.storagePath, input.uid)) {
    throw Object.assign(new Error('Screenshot não pertence à sessão atual.'), {
      code: 'forbidden',
    });
  }
  const object = await dependencies.store.get(input.storagePath);
  const validationError = validateScreenshotRequest(object.contentType, object.size);
  if (validationError) throw Object.assign(new Error(validationError), { code: 'invalid-image' });
  try {
    const image = await object.download();
    if (!hasImageSignature(object.contentType, image)) {
      throw Object.assign(new Error('O conteúdo não corresponde ao tipo informado.'), {
        code: 'invalid-image',
      });
    }
    if (dependencies.costBudget) {
      const cost = await dependencies.costBudget.reserve(
        'ocr',
        input.requestId,
        dependencies.now(),
      );
      if (!cost.allowed) {
        throw Object.assign(new Error(cost.message), { code: 'cost-protection' });
      }
    }
    if (
      !(await dependencies.quota.reserve(
        dependencies.now().toISOString().slice(0, 7),
        input.requestId,
      ))
    ) {
      throw Object.assign(new Error('A cota mensal de OCR foi atingida.'), {
        code: 'quota-exceeded',
      });
    }
    const text = (await dependencies.vision.extractText(image)).trim();
    if (!text)
      throw Object.assign(new Error('Não foi possível extrair texto da imagem.'), {
        code: 'empty-ocr',
      });
    return { text, processedAt: dependencies.now().toISOString() };
  } finally {
    await object.remove().catch(() => undefined);
  }
}

type AdminBucket = {
  file(path: string): {
    getMetadata(): Promise<
      [
        {
          contentType?: string;
          size?: string | number;
          timeCreated?: string;
          metadata?: Record<string, unknown>;
        },
        unknown,
      ]
    >;
    download(): Promise<[Buffer]>;
    delete(options?: { ignoreNotFound?: boolean }): Promise<unknown>;
  };
  getFiles(options: { prefix: string }): Promise<
    [
      Array<{
        name: string;
        metadata: { timeCreated?: string; metadata?: Record<string, unknown> };
      }>,
      unknown,
      unknown,
    ]
  >;
};

class AdminScreenshotStore implements ScreenshotStore {
  private readonly bucket: AdminBucket;

  constructor(bucket: AdminBucket) {
    this.bucket = bucket;
  }

  async get(path: string) {
    const file = this.bucket.file(path);
    const [metadata] = await file.getMetadata();
    const createdAt = metadata.metadata?.createdAt;
    return {
      contentType: metadata.contentType ?? '',
      size: Number(metadata.size ?? 0),
      createdAt:
        typeof createdAt === 'string'
          ? createdAt
          : (metadata.timeCreated ?? new Date(0).toISOString()),
      download: async () => (await file.download())[0],
      remove: async () => {
        await file.delete({ ignoreNotFound: true });
      },
    } satisfies ScreenshotObject;
  }

  async list(prefix: string) {
    const [files] = await this.bucket.getFiles({ prefix });
    return Promise.all(
      files.map(async (file) => ({ ...(await this.get(file.name)), path: file.name })),
    );
  }
}

class CloudVisionGateway implements VisionGateway {
  private readonly client = new ImageAnnotatorClient();

  async extractText(image: Buffer) {
    const [result] = await this.client.documentTextDetection({ image: { content: image } });
    return result.fullTextAnnotation?.text ?? '';
  }
}

function errorStatus(code: unknown) {
  switch (code) {
    case 'forbidden':
      return 403;
    case 'quota-exceeded':
      return 429;
    case 'cost-protection':
      return 429;
    case 'invalid-image':
      return 415;
    case 'empty-ocr':
      return 422;
    default:
      return 503;
  }
}

export const getScreenshotOcr = onRequest(async (request, response) => {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'POST') {
    response.status(405).json({ code: 'method-not-allowed', message: 'Use POST.' });
    return;
  }
  const authorization = request.get('authorization') ?? '';
  if (!authorization.startsWith('Bearer ')) {
    response.status(401).json({ code: 'unauthenticated', message: 'Sessão Firebase ausente.' });
    return;
  }
  let decoded;
  try {
    const { adminAuth } = await import('../services/firebase-admin');
    decoded = await adminAuth().verifyIdToken(authorization.slice('Bearer '.length));
  } catch {
    response.status(401).json({ code: 'unauthenticated', message: 'Sessão Firebase inválida.' });
    return;
  }
  const body = requestBody(request.body);
  if (!body || !storagePathForUid(body.storagePath, decoded.uid)) {
    response
      .status(400)
      .json({ code: 'invalid-request', message: 'Referência de screenshot inválida.' });
    return;
  }
  try {
    const [{ adminBucket }, { FirestoreOcrQuota }, { FirestoreOperationalBudget }] =
      await Promise.all([
        import('../services/firebase-admin'),
        import('../services/ocr-quota'),
        import('../services/operational-budget'),
      ]);
    const result = await processScreenshotRequest(
      { ...body, uid: decoded.uid },
      {
        store: new AdminScreenshotStore(adminBucket()),
        vision: new CloudVisionGateway(),
        quota: new FirestoreOcrQuota(),
        costBudget: new FirestoreOperationalBudget(),
        now: () => new Date(),
      },
    );
    response.status(200).json(result);
  } catch (error: unknown) {
    const code = error instanceof Error && 'code' in error ? error.code : undefined;
    const message = error instanceof Error ? error.message : 'Falha ao processar OCR.';
    response.status(errorStatus(code)).json({ code: code ?? 'ocr-unavailable', message });
  }
});
