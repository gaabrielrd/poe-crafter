import { ImageAnnotatorClient } from '@google-cloud/vision';
import { onRequest } from 'firebase-functions/v2/https';

interface ScreenshotOcrResult {
  text: string;
  processedAt: string;
}

export const MAX_SCREENSHOT_BYTES = 8 * 1024 * 1024;
export const SCREENSHOT_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;
export const MAX_MONTHLY_OCR = 1_000;

let monthKey = new Date().toISOString().slice(0, 7);
let monthlyCount = 0;
let visionClient: ImageAnnotatorClient | undefined;

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

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function reserveQuota() {
  const month = currentMonth();
  if (month !== monthKey) {
    monthKey = month;
    monthlyCount = 0;
  }
  if (monthlyCount >= MAX_MONTHLY_OCR) throw new Error('A cota mensal de OCR foi atingida.');
  monthlyCount += 1;
}

function imageBody(request: { body: unknown; rawBody?: Buffer }) {
  const rawBody = request.rawBody;
  if (rawBody && rawBody.length > 0) return rawBody;
  if (Buffer.isBuffer(request.body)) return request.body;
  throw new Error('O corpo da imagem está vazio.');
}

async function extractText(image: Buffer): Promise<string> {
  const fixture = process.env.POE_OCR_FIXTURE_TEXT;
  if (fixture) return fixture;
  if (process.env.POE_OCR_ENABLED !== 'true') {
    throw new Error('OCR indisponível: habilite POE_OCR_ENABLED no backend.');
  }
  visionClient ??= new ImageAnnotatorClient();
  const [result] = await visionClient.documentTextDetection({ image: { content: image } });
  return result.fullTextAnnotation?.text?.trim() ?? '';
}

export const getScreenshotOcr = onRequest(async (request, response) => {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'POST') {
    response.status(405).json({ code: 'method-not-allowed', message: 'Use POST.' });
    return;
  }

  const contentType = request.get('content-type')?.split(';', 1)[0]?.trim() ?? '';
  if (validateScreenshotRequest(contentType, 1)) {
    response
      .status(415)
      .json({ code: 'unsupported-media-type', message: 'Use PNG, JPEG ou WebP.' });
    return;
  }

  let image: Buffer;
  try {
    image = imageBody(request);
  } catch (error: unknown) {
    response.status(400).json({
      code: 'invalid-image',
      message: error instanceof Error ? error.message : 'Imagem inválida.',
    });
    return;
  }
  if (validateScreenshotRequest(contentType, image.length)) {
    response
      .status(413)
      .json({ code: 'image-too-large', message: 'A imagem deve ter no máximo 8 MB.' });
    return;
  }
  if (!hasImageSignature(contentType, image)) {
    response
      .status(415)
      .json({ code: 'invalid-image', message: 'O conteúdo não corresponde ao tipo informado.' });
    return;
  }

  try {
    reserveQuota();
    const text = await extractText(image);
    if (!text) {
      response
        .status(422)
        .json({ code: 'empty-ocr', message: 'Não foi possível extrair texto da imagem.' });
      return;
    }
    const result: ScreenshotOcrResult = { text, processedAt: new Date().toISOString() };
    response.status(200).json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Falha ao processar OCR.';
    response.status(503).json({ code: 'ocr-unavailable', message });
  }
});
