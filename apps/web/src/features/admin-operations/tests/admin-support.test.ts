import { afterEach, describe, expect, it, vi } from 'vitest';
import { isAdminSupportResponse, type AdminSupportResponse } from '../model/admin-support';
import { requestAdminCraftSupport } from '../services/admin-support';

const auth = { getIdToken: vi.fn(() => Promise.resolve('token')) } as never;
const craft = {
  id: 'craft_123',
  ownerUid: 'owner-1',
  schemaVersion: 1 as const,
  title: 'Divine Crown',
  league: null,
  manualPricing: false,
  status: 'confirmed' as const,
  target: { item: { baseName: 'Divine Crown' }, classifications: {} },
  createdAt: '2026-09-06T10:00:00.000Z',
  updatedAt: '2026-09-06T10:05:00.000Z',
};
const validResponse: AdminSupportResponse = { schemaVersion: 1, craft };

afterEach(() => vi.restoreAllMocks());

describe('contrato de suporte administrativo', () => {
  it('aceita craft versionado e rejeita conteúdo incompatível', () => {
    expect(isAdminSupportResponse(validResponse)).toBe(true);
    expect(isAdminSupportResponse({ ...validResponse, craft: { ...craft, status: 'draft' } })).toBe(
      false,
    );
  });
});

describe('requestAdminCraftSupport', () => {
  it('envia ID, justificativa e bearer e retorna craft', async () => {
    const fetch = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify(validResponse), { status: 200 })),
    );
    vi.stubGlobal('fetch', fetch);

    await expect(requestAdminCraftSupport('craft_123', 'Reprodução de bug', auth)).resolves.toEqual(
      validResponse,
    );
    expect(fetch).toHaveBeenCalledWith('/api/admin/support/craft', {
      method: 'POST',
      headers: { authorization: 'Bearer token', 'content-type': 'application/json' },
      body: JSON.stringify({ craftId: 'craft_123', reason: 'Reprodução de bug' }),
    });
  });

  it.each([
    [401, 'unauthenticated'],
    [403, 'admin-forbidden'],
    [404, 'craft-not-found'],
    [422, 'craft-invalid'],
    [503, 'support-access-unavailable'],
  ] as const)('mapeia HTTP %s para %s', async (status, code) => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('{}', { status }))),
    );
    await expect(requestAdminCraftSupport('craft_123', 'bug', auth)).rejects.toMatchObject({
      code,
    });
  });

  it('rejeita resposta sem contrato', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('{}', { status: 200 }))),
    );
    await expect(requestAdminCraftSupport('craft_123', 'bug', auth)).rejects.toMatchObject({
      code: 'invalid-response',
    });
  });
});
