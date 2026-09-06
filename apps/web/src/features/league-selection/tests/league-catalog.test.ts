import { describe, expect, it, vi } from 'vitest';
import { loadLeagueCatalog } from '../services/league-catalog';

function response(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: () => Promise.resolve(body),
  } as Response;
}

describe('loadLeagueCatalog', () => {
  it('normaliza a resposta válida do endpoint próprio', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      response({
        fetchedAt: '2026-09-05T12:00:00.000Z',
        leagues: [{ id: 'settlers', name: 'Settlers', platform: 'pc' }],
      }),
    );

    await expect(
      loadLeagueCatalog({ apiUrl: 'https://api.example.test', fetchImpl }),
    ).resolves.toEqual({
      fetchedAt: '2026-09-05T12:00:00.000Z',
      leagues: [{ id: 'settlers', name: 'Settlers', platform: 'pc' }],
    });
    expect(fetchImpl).toHaveBeenCalledWith('https://api.example.test/leagues', {
      headers: { accept: 'application/json' },
    });
  });

  it('rejeita payload inválido e falha do endpoint', async () => {
    const invalid = vi.fn().mockResolvedValue(response({ leagues: [{ id: 'x' }] }));
    await expect(
      loadLeagueCatalog({ apiUrl: 'https://api.example.test', fetchImpl: invalid }),
    ).rejects.toThrow('dados inválidos');

    const failed = vi.fn().mockResolvedValue(response({}, false, 503));
    await expect(
      loadLeagueCatalog({ apiUrl: 'https://api.example.test', fetchImpl: failed }),
    ).rejects.toThrow('503');
  });
});
