import { env } from '@/shared/config';
import { getDefaultAuthGateway, type AuthGateway } from '@/features/identity';
import { isCostGuardResponse, type CostGuardResponse } from '../model/cost-guard';

export type CostGuardErrorCode =
  | 'unauthenticated'
  | 'invalid-request'
  | 'cost-blocked'
  | 'invalid-response'
  | 'cost-guard-unavailable';

export class CostGuardError extends Error {
  readonly code: CostGuardErrorCode;
  readonly response?: CostGuardResponse;

  constructor(code: CostGuardErrorCode, message: string, response?: CostGuardResponse) {
    super(message);
    this.name = 'CostGuardError';
    this.code = code;
    this.response = response;
  }
}

function endpoint() {
  return env.apiUrl
    ? `${env.apiUrl.replace(/\/$/, '')}/operations/cost-guard`
    : '/api/operations/cost-guard';
}

function fixtureResponse(requestId: string): CostGuardResponse {
  return {
    schemaVersion: 1,
    operation: 'planning',
    requestId,
    allowed: true,
    code: 'allowed',
    estimatedCostUsd: 0,
    budgetUsd: 10,
    thresholdUsd: 10,
    message: 'Operação local autorizada.',
  };
}

export async function reservePlanningCost(
  requestId: string,
  auth: AuthGateway = getDefaultAuthGateway(),
): Promise<CostGuardResponse> {
  if (env.authFixture || (!env.apiUrl && !env.isProduction)) return fixtureResponse(requestId);
  const response = await fetch(endpoint(), {
    method: 'POST',
    headers: {
      authorization: `Bearer ${await auth.getIdToken()}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ operation: 'planning', requestId }),
  });
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new CostGuardError(
      'invalid-response',
      'A proteção de custo retornou uma resposta inválida.',
    );
  }
  if (response.status === 401) {
    throw new CostGuardError('unauthenticated', 'Sua sessão não está autenticada.');
  }
  if (response.status === 400) {
    throw new CostGuardError('invalid-request', 'A solicitação de planejamento é inválida.');
  }
  if (!response.ok) {
    throw new CostGuardError(
      'cost-guard-unavailable',
      'Não foi possível consultar a proteção de custo. Tente novamente.',
    );
  }
  if (!isCostGuardResponse(payload)) {
    throw new CostGuardError(
      'invalid-response',
      'A proteção de custo retornou dados incompatíveis.',
    );
  }
  if (!payload.allowed) throw new CostGuardError('cost-blocked', payload.message, payload);
  return payload;
}
