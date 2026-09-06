import { env } from '@/shared/config';
import { getDefaultAuthGateway, type AuthGateway } from '@/features/identity';
import { isAdminOverview, type AdminOverview } from '../model/admin-overview';

export type AdminOverviewErrorCode =
  'admin-forbidden' | 'unauthenticated' | 'admin-overview-unavailable' | 'invalid-response';

export class AdminOverviewError extends Error {
  readonly code: AdminOverviewErrorCode;

  constructor(code: AdminOverviewErrorCode, message: string) {
    super(message);
    this.name = 'AdminOverviewError';
    this.code = code;
  }
}

function endpoint() {
  return env.apiUrl ? `${env.apiUrl.replace(/\/$/, '')}/admin/overview` : '/api/admin/overview';
}

export async function fetchAdminOverview(
  auth: AuthGateway = getDefaultAuthGateway(),
): Promise<AdminOverview> {
  const response = await fetch(endpoint(), {
    headers: { authorization: `Bearer ${await auth.getIdToken()}` },
  });
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new AdminOverviewError(
      'invalid-response',
      'O diagnóstico administrativo retornou uma resposta inválida.',
    );
  }
  if (response.status === 401) {
    throw new AdminOverviewError('unauthenticated', 'Sua sessão não está autenticada.');
  }
  if (response.status === 403) {
    throw new AdminOverviewError(
      'admin-forbidden',
      'Sua conta não possui autorização administrativa.',
    );
  }
  if (!response.ok) {
    throw new AdminOverviewError(
      'admin-overview-unavailable',
      'Não foi possível carregar o diagnóstico operacional. Tente novamente.',
    );
  }
  if (!isAdminOverview(payload)) {
    throw new AdminOverviewError(
      'invalid-response',
      'O diagnóstico administrativo retornou dados incompatíveis.',
    );
  }
  return payload;
}
