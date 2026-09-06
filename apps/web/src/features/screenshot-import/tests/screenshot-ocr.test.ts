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

    await expect(
      submitScreenshot(file, { apiUrl: 'https://api.example.test', fetchImpl }),
    ).resolves.toEqual({
      text: 'New Item\nDivine Crown',
      processedAt: '2026-09-06T00:00:00.000Z',
    });
    expect(fetchImpl).toHaveBeenCalledWith('https://api.example.test/screenshot-ocr', {
      method: 'POST',
      headers: { 'content-type': 'image/webp', 'x-file-name': 'item.webp' },
      body: file,
    });
  });

  it('transforma erro do backend em mensagem acionável', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(response({ message: 'A cota mensal de OCR foi atingida.' }, false, 429));

    await expect(
      submitScreenshot(new File(['image'], 'item.png', { type: 'image/png' }), {
        apiUrl: 'https://api.example.test',
        fetchImpl,
      }),
    ).rejects.toThrow('A cota mensal de OCR foi atingida.');
  });
});
