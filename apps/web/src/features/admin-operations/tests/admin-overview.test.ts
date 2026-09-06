import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchAdminOverview } from '../services/admin-overview';
import { isAdminOverview } from '../model/admin-overview';

const validOverview = {
  schemaVersion: 1,
  generatedAt: '2026-09-06T12:00:00.000Z',
  activeLeague: { id: 'standard', name: 'Standard', platform: 'pc' },
  dataset: { version: 'starter-1', status: 'active', updatedAt: '2026-09-06T10:00:00.000Z' },
  priceSnapshot: { id: 'prices-1', status: 'active', fetchedAt: '2026-09-06T09:00:00.000Z' },
  queue: { queued: 0, running: 0, failed: 0 },
  recentFailures: [],
};

const auth = { getIdToken: vi.fn(() => Promise.resolve('token')) } as never;

afterEach(() => {
  vi.restoreAllMocks();
});

describe('contrato do diagnóstico administrativo', () => {
  it('aceita uma resposta versionada completa', () => {
    expect(isAdminOverview(validOverview)).toBe(true);
  });

  it.each([
    { ...validOverview, schemaVersion: 2 },
    { ...validOverview, generatedAt: 'invalid' },
    { ...validOverview, activeLeague: { id: '', name: 'Standard', platform: 'pc' } },
    {
      ...validOverview,
      dataset: { version: 'x', status: 'unknown', updatedAt: validOverview.generatedAt },
    },
    { ...validOverview, priceSnapshot: { id: 'x', status: 'active', fetchedAt: 'invalid' } },
    { ...validOverview, queue: { queued: -1, running: 0, failed: 0 } },
    {
      ...validOverview,
      recentFailures: [
        { id: 'x', type: 'job', status: 'failed', updatedAt: 'invalid', errorMessage: 'x' },
      ],
    },
  ])('rejeita resposta inválida %#', (payload) => {
    expect(isAdminOverview(payload)).toBe(false);
  });
});

describe('fetchAdminOverview', () => {
  it('envia o bearer token e retorna o diagnóstico', async () => {
    const fetch = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify(validOverview), { status: 200 })),
    );
    vi.stubGlobal('fetch', fetch);

    await expect(fetchAdminOverview(auth)).resolves.toEqual(validOverview);
    expect(fetch).toHaveBeenCalledWith('/api/admin/overview', {
      headers: { authorization: 'Bearer token' },
    });
  });

  it.each([
    [401, 'unauthenticated', 'Sua sessão não está autenticada.'],
    [403, 'admin-forbidden', 'Sua conta não possui autorização administrativa.'],
    [
      503,
      'admin-overview-unavailable',
      'Não foi possível carregar o diagnóstico operacional. Tente novamente.',
    ],
  ] as const)('mapeia HTTP %s para erro observável', async (status, code, message) => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(new Response(JSON.stringify({ message: 'backend' }), { status })),
      ),
    );

    await expect(fetchAdminOverview(auth)).rejects.toMatchObject({ code, message });
  });

  it('mantém erro quando o corpo não é JSON ou o schema não é compatível', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('not-json', { status: 200 }))),
    );
    await expect(fetchAdminOverview(auth)).rejects.toMatchObject({
      code: 'invalid-response',
    });

    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response(JSON.stringify({}), { status: 200 }))),
    );
    await expect(fetchAdminOverview(auth)).rejects.toMatchObject({ code: 'invalid-response' });
  });
});
