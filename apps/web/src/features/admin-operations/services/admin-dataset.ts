import { env } from '@/shared/config';
import { getDefaultAuthGateway, type AuthGateway } from '@/features/identity';
import {
  isAdminDatasetActionResponse,
  type AdminDatasetAction,
  type AdminDatasetActionResponse,
  type AdminDatasetIssue,
} from '../model/admin-dataset';

export type AdminDatasetErrorCode =
  | 'unauthenticated'
  | 'admin-forbidden'
  | 'invalid-action'
  | 'dataset-conflict'
  | 'validation-failed'
  | 'invalid-response'
  | 'admin-dataset-unavailable';

export class AdminDatasetError extends Error {
  readonly code: AdminDatasetErrorCode;
  readonly issues: readonly AdminDatasetIssue[];

  constructor(
    code: AdminDatasetErrorCode,
    message: string,
    issues: readonly AdminDatasetIssue[] = [],
  ) {
    super(message);
    this.name = 'AdminDatasetError';
    this.code = code;
    this.issues = issues;
  }
}

function endpoint() {
  return env.apiUrl ? `${env.apiUrl.replace(/\/$/, '')}/admin/datasets` : '/api/admin/datasets';
}

function statusError(status: number, payload: unknown): AdminDatasetError {
  const issues = isAdminDatasetActionResponse(payload) ? (payload.issues ?? []) : [];
  if (status === 401) {
    return new AdminDatasetError('unauthenticated', 'Sua sessão não está autenticada.', issues);
  }
  if (status === 403) {
    return new AdminDatasetError(
      'admin-forbidden',
      'Sua conta não possui autorização administrativa.',
      issues,
    );
  }
  if (status === 400) {
    return new AdminDatasetError('invalid-action', 'A ação de dataset é inválida.', issues);
  }
  if (status === 409) {
    return new AdminDatasetError(
      'dataset-conflict',
      'A versão entrou em conflito com outra operação. Recarregue o diagnóstico e tente novamente.',
      issues,
    );
  }
  if (status === 422) {
    return new AdminDatasetError(
      'validation-failed',
      'O dataset não passou na validação do planner.',
      issues,
    );
  }
  return new AdminDatasetError(
    'admin-dataset-unavailable',
    'Não foi possível concluir a operação do dataset. Tente novamente.',
    issues,
  );
}

export async function manageAdminDataset(
  action: AdminDatasetAction,
  version: string,
  dataset: unknown = undefined,
  auth: AuthGateway = getDefaultAuthGateway(),
): Promise<AdminDatasetActionResponse> {
  const body = { action, version, ...(dataset === undefined ? {} : { dataset }) };
  const response = await fetch(endpoint(), {
    method: 'POST',
    headers: {
      authorization: `Bearer ${await auth.getIdToken()}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new AdminDatasetError(
      'invalid-response',
      'A operação de dataset retornou uma resposta inválida.',
    );
  }
  if (!response.ok) throw statusError(response.status, payload);
  if (!isAdminDatasetActionResponse(payload)) {
    throw new AdminDatasetError(
      'invalid-response',
      'A operação de dataset retornou dados incompatíveis.',
    );
  }
  return payload;
}
