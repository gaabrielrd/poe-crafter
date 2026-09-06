import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_SCREENSHOT_BYTES,
  processScreenshotRequest,
  validateScreenshotRequest,
} from '../functions/src/api/screenshot-ocr.ts';
import {
  removeExpiredScreenshots,
  SCREENSHOT_TTL_MS,
} from '../functions/src/scheduled/cleanup-screenshots.ts';

test('valida tipo e tamanho da imagem antes do OCR', () => {
  assert.equal(validateScreenshotRequest('image/png', 1), null);
  assert.match(validateScreenshotRequest('image/gif', 1) ?? '', /PNG/);
  assert.match(validateScreenshotRequest('image/png', 0) ?? '', /vazio/);
  assert.match(validateScreenshotRequest('image/png', MAX_SCREENSHOT_BYTES + 1) ?? '', /8 MB/);
});

test('processa somente o objeto do UID e remove o screenshot mesmo com sucesso', async () => {
  const removed = [];
  const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const result = await processScreenshotRequest(
    {
      uid: 'uid-1',
      storagePath: 'screenshots/uid-1/upload-12345678',
      requestId: 'upload-12345678',
    },
    {
      now: () => new Date('2026-09-06T00:00:00.000Z'),
      quota: { reserve: async () => true },
      vision: { extractText: async () => 'New Item\nDivine Crown' },
      store: {
        get: async () => ({
          contentType: 'image/png',
          size: png.length,
          createdAt: '2026-09-06T00:00:00.000Z',
          download: async () => png,
          remove: async () => removed.push(true),
        }),
      },
    },
  );
  assert.equal(result.text, 'New Item\nDivine Crown');
  assert.deepEqual(removed, [true]);
});

test('rejeita caminho de outro UID sem acessar Storage', async () => {
  await assert.rejects(
    processScreenshotRequest(
      { uid: 'uid-1', storagePath: 'screenshots/uid-2/upload-1234', requestId: 'upload-1234' },
      {
        now: () => new Date(),
        quota: { reserve: async () => true },
        vision: { extractText: async () => 'unused' },
        store: {
          get: async () => {
            throw new Error('não deveria acessar');
          },
        },
      },
    ),
    /não pertence/,
  );
});

test('remove apenas objetos de screenshots mais antigos que 24 horas', async () => {
  const deleted = [];
  const now = new Date('2026-09-06T12:00:00.000Z');
  const count = await removeExpiredScreenshots(
    [
      {
        name: 'screenshots/uid-1/old',
        createdAt: new Date(now - SCREENSHOT_TTL_MS - 1).toISOString(),
        delete: async () => deleted.push('old'),
      },
      {
        name: 'screenshots/uid-1/new',
        createdAt: new Date(now - SCREENSHOT_TTL_MS + 1).toISOString(),
        delete: async () => deleted.push('new'),
      },
      {
        name: 'private/not-screenshot',
        createdAt: new Date(now - SCREENSHOT_TTL_MS * 2).toISOString(),
        delete: async () => deleted.push('private'),
      },
    ],
    now,
  );
  assert.equal(count, 1);
  assert.deepEqual(deleted, ['old']);
});
