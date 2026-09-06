import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  isAdminDatasetActionResponse,
  type AdminDatasetActionResponse,
} from '../model/admin-dataset';
import { AdminDatasetError, manageAdminDataset } from '../services/admin-dataset';

const auth = { getIdToken: vi.fn(() => Promise.resolve('token')) } as never;
const validResponse: AdminDatasetActionResponse = {
  schemaVersion: 1,
  action: 'import',
  version: 'starter-2',
  status: 'imported',
  idempotent: true,
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('contrato das ações administrativas de dataset', () => {
  it('aceita resposta versionada com status e issues opcionais', () => {
    expect(isAdminDatasetActionResponse(validResponse)).toBe(true);
    expect(
      isAdminDatasetActionResponse({
        ...validResponse,
        issues: [{ path: 'recipes[0].steps', code: 'invalid-value', message: 'inválido' }],
      }),
    ).toBe(true);
  });

  it.each([
    { ...validResponse, schemaVersion: 2 },
    { ...validResponse, action: 'unknown' },
    { ...validResponse, status: 'unknown' },
    { ...validResponse, version: '' },
    { ...validResponse, issues: [{ path: 'x', code: 'unknown', message: 'x' }] },
  ])('rejeita resposta inválida %#', (payload) => {
    expect(isAdminDatasetActionResponse(payload)).toBe(false);
  });
});

describe('manageAdminDataset', () => {
  it('envia ação, versão, JSON e bearer ao endpoint', async () => {
    const fetch = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify(validResponse), { status: 200 })),
    );
    vi.stubGlobal('fetch', fetch);
    const dataset = { schemaVersion: 1, recipes: [] };

    await expect(manageAdminDataset('import', 'starter-2', dataset, auth)).resolves.toEqual(
      validResponse,
    );
    expect(fetch).toHaveBeenCalledWith('/api/admin/datasets', {
      method: 'POST',
      headers: { authorization: 'Bearer token', 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'import', version: 'starter-2', dataset }),
    });
  });

  it('não inclui dataset nas ações de ciclo', async () => {
    const response: AdminDatasetActionResponse = {
      schemaVersion: 1,
      action: 'publish',
      version: 'starter-2',
      status: 'active',
    };
    const fetch = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      void input;
      void init;
      return Promise.resolve(new Response(JSON.stringify(response), { status: 200 }));
    });
    vi.stubGlobal('fetch', fetch);

    await manageAdminDataset('publish', 'starter-2', undefined, auth);
    expect(JSON.parse(fetch.mock.calls[0]?.[1]?.body as string)).toEqual({
      action: 'publish',
      version: 'starter-2',
    });
  });

  it('mapeia 422 e preserva issues para a tela', async () => {
    const response: AdminDatasetActionResponse = {
      schemaVersion: 1,
      action: 'validate',
      version: 'broken',
      status: 'failed',
      issues: [{ path: 'schemaVersion', code: 'invalid-value', message: 'deve ser 1' }],
    };
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response(JSON.stringify(response), { status: 422 }))),
    );

    await expect(manageAdminDataset('validate', 'broken', undefined, auth)).rejects.toMatchObject({
      code: 'validation-failed',
      issues: response.issues,
    } satisfies Partial<AdminDatasetError>);
  });

  it('distingue resposta inválida de erro HTTP', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('{}', { status: 200 }))),
    );
    await expect(
      manageAdminDataset('validate', 'starter-2', undefined, auth),
    ).rejects.toMatchObject({
      code: 'invalid-response',
    });
  });
});
