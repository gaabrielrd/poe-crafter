export const MAX_SCREENSHOT_BYTES = 8 * 1024 * 1024;

export const SCREENSHOT_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;

export type ScreenshotValidationErrorCode = 'empty' | 'type' | 'too-large';

export interface ScreenshotValidationError {
  code: ScreenshotValidationErrorCode;
  message: string;
}

export function validateScreenshot(
  file: Pick<File, 'size' | 'type'>,
): ScreenshotValidationError | null {
  if (file.size === 0) {
    return { code: 'empty', message: 'Escolha uma imagem que não esteja vazia.' };
  }
  if (!SCREENSHOT_MIME_TYPES.includes(file.type as (typeof SCREENSHOT_MIME_TYPES)[number])) {
    return { code: 'type', message: 'Use uma imagem PNG, JPEG ou WebP.' };
  }
  if (file.size > MAX_SCREENSHOT_BYTES) {
    return { code: 'too-large', message: 'A imagem deve ter no máximo 8 MB.' };
  }
  return null;
}
