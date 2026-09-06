import { describe, expect, it, vi } from 'vitest';
import { submitScreenshot } from '../services/screenshot-ocr';

function response(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: () => Promise.resolve(body) } as Response;
}

describe('submitScreenshot', () => {
  it('envia a imagem para o endpoint próprio e valida o retorno', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(
        response({ text: 'New Item\nDivine Crown', processedAt: '2026-09-06T00:00:00.000Z' }),
      );
    const file = new File(['image'], 'item.webp', { type: 'image/webp' });
    const authGateway = {
      getIdToken: vi.fn().mockResolvedValue('token'),
      getCurrentUser: vi.fn().mockReturnValue({ uid: 'uid-1', kind: 'anonymous' as const }),
    } as never;
    const storageGateway = {
      upload: vi
        .fn()
        .mockResolvedValue({ storagePath: 'screenshots/uid-1/upload-1', uploadId: 'upload-1' }),
      remove: vi.fn().mockResolvedValue(undefined),
    };

    await expect(
      submitScreenshot(file, {
        apiUrl: 'https://api.example.test',
        fetchImpl,
        authGateway,
        storageGateway,
      }),
    ).resolves.toEqual({
      text: 'New Item\nDivine Crown',
      processedAt: '2026-09-06T00:00:00.000Z',
    });
    expect(fetchImpl).toHaveBeenCalledWith('https://api.example.test/screenshot-ocr', {
      method: 'POST',
      headers: { authorization: 'Bearer token', 'content-type': 'application/json' },
      body: JSON.stringify({ storagePath: 'screenshots/uid-1/upload-1', requestId: 'upload-1' }),
    });
  });

  it('transforma erro do backend em mensagem acionável', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(response({ message: 'A cota mensal de OCR foi atingida.' }, false, 429));

    const storageGateway = {
      upload: vi
        .fn()
        .mockResolvedValue({ storagePath: 'screenshots/uid-1/upload-2', uploadId: 'upload-2' }),
      remove: vi.fn().mockResolvedValue(undefined),
    };
    const authGateway = {
      getIdToken: vi.fn().mockResolvedValue('token'),
      getCurrentUser: vi.fn().mockReturnValue({ uid: 'uid-1', kind: 'anonymous' as const }),
    } as never;

    await expect(
      submitScreenshot(new File(['image'], 'item.png', { type: 'image/png' }), {
        apiUrl: 'https://api.example.test',
        fetchImpl,
        storageGateway,
        authGateway,
      }),
    ).rejects.toThrow('A cota mensal de OCR foi atingida.');
  });
});
