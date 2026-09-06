import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_SCREENSHOT_BYTES,
  validateScreenshotRequest,
} from '../functions/src/api/screenshot-ocr.ts';

test('valida tipo e tamanho da imagem antes do OCR', () => {
  assert.equal(validateScreenshotRequest('image/png', 1), null);
  assert.match(validateScreenshotRequest('image/gif', 1) ?? '', /PNG/);
  assert.match(validateScreenshotRequest('image/png', 0) ?? '', /vazio/);
  assert.match(validateScreenshotRequest('image/png', MAX_SCREENSHOT_BYTES + 1) ?? '', /8 MB/);
});
