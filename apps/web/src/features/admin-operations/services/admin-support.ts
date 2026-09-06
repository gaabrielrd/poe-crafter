import { env } from '@/shared/config';
import { getDefaultAuthGateway, type AuthGateway } from '@/features/identity';
import { isAdminSupportResponse, type AdminSupportResponse } from '../model/admin-support';

export type AdminSupportErrorCode =
  | 'unauthenticated'
  | 'admin-forbidden'
  | 'invalid-request'
  | 'craft-not-found'
  | 'craft-invalid'
  | 'invalid-response'
  | 'support-access-unavailable';

export class AdminSupportError extends Error {
  readonly code: AdminSupportErrorCode;

  constructor(code: AdminSupportErrorCode, message: string) {
    super(message);
    this.name = 'AdminSupportError';
    this.code = code;
  }
}

function endpoint() {
  return env.apiUrl
    ? `${env.apiUrl.replace(/\/$/, '')}/admin/support/craft`
    : '/api/admin/support/craft';
}

function httpError(status: number): AdminSupportError {
  if (status === 401)
    return new AdminSupportError('unauthenticated', 'Sua sessão não está autenticada.');
  if (status === 403)
    return new AdminSupportError(
      'admin-forbidden',
      'Sua conta não possui autorização administrativa.',
    );
  if (status === 400)
    return new AdminSupportError(
      'invalid-request',
      'Informe um craftId e uma justificativa válidos.',
    );
  if (status === 404) return new AdminSupportError('craft-not-found', 'Craft não encontrado.');
  if (status === 422)
    return new AdminSupportError('craft-invalid', 'O craft armazenado é inválido.');
  return new AdminSupportError(
    'support-access-unavailable',
    'Não foi possível registrar o acesso de suporte. Tente novamente.',
  );
}

export async function requestAdminCraftSupport(
  craftId: string,
  reason: string,
  auth: AuthGateway = getDefaultAuthGateway(),
): Promise<AdminSupportResponse> {
  const response = await fetch(endpoint(), {
    method: 'POST',
    headers: {
      authorization: `Bearer ${await auth.getIdToken()}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ craftId, reason }),
  });
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new AdminSupportError(
      'invalid-response',
      'O acesso de suporte retornou uma resposta inválida.',
    );
  }
  if (!response.ok) throw httpError(response.status);
  if (!isAdminSupportResponse(payload)) {
    throw new AdminSupportError(
      'invalid-response',
      'O acesso de suporte retornou dados incompatíveis.',
    );
  }
  return payload;
}
