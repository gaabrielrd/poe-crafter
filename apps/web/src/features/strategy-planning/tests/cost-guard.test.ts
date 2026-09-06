import { afterEach, describe, expect, it, vi } from 'vitest';
import { env } from '@/shared/config';
import { isCostGuardResponse } from '../model/cost-guard';
import { CostGuardError, reservePlanningCost } from '../services/cost-guard';

const auth = { getIdToken: vi.fn(() => Promise.resolve('token')) } as never;
const allowed = {
  schemaVersion: 1,
  operation: 'planning' as const,
  requestId: 'plan-123456',
  allowed: true,
  code: 'allowed' as const,
  estimatedCostUsd: 0.1,
  budgetUsd: 10,
  thresholdUsd: 10,
  message: 'Operação autorizada.',
};

const originalApiUrl = env.apiUrl;

afterEach(() => {
  vi.restoreAllMocks();
  (env as { apiUrl: string | undefined }).apiUrl = originalApiUrl;
});

describe('cost guard', () => {
  it('valida resposta versionada e rejeita bloqueio como erro recuperável', async () => {
    (env as { apiUrl: string | undefined }).apiUrl = 'https://api.example.test';
    expect(isCostGuardResponse(allowed)).toBe(true);
    const blocked = {
      ...allowed,
      allowed: false,
      code: 'budget-exceeded' as const,
      message: 'Pausado.',
    };
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response(JSON.stringify(blocked), { status: 200 }))),
    );
    await expect(reservePlanningCost('plan-123456', auth)).rejects.toMatchObject({
      code: 'cost-blocked',
      message: 'Pausado.',
    } satisfies Partial<CostGuardError>);
  });

  it('envia bearer e requestId para o endpoint', async () => {
    (env as { apiUrl: string | undefined }).apiUrl = 'https://api.example.test';
    const fetch = vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify(allowed), { status: 200 })),
    );
    vi.stubGlobal('fetch', fetch);
    await expect(reservePlanningCost('plan-123456', auth)).resolves.toEqual(allowed);
    expect(fetch).toHaveBeenCalledWith('https://api.example.test/operations/cost-guard', {
      method: 'POST',
      headers: { authorization: 'Bearer token', 'content-type': 'application/json' },
      body: JSON.stringify({ operation: 'planning', requestId: 'plan-123456' }),
    });
  });
});
