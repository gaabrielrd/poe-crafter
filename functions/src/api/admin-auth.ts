import { adminAuth } from '../services/firebase-admin';
import { isAuthorizedAdmin, parseAdminUids } from '../model/admin-operations';

export interface AdminRequestLike {
  get(name: string): string | undefined;
}

export type AdminAuthResult =
  | { ok: true; uid: string }
  | {
      ok: false;
      status: 401 | 403;
      code: 'unauthenticated' | 'admin-forbidden';
      message: string;
    };

export async function authenticateAdmin(request: AdminRequestLike): Promise<AdminAuthResult> {
  const authorization = request.get('authorization') ?? '';
  if (!authorization.startsWith('Bearer ')) {
    return { ok: false, status: 401, code: 'unauthenticated', message: 'Sessão Firebase ausente.' };
  }

  let decoded;
  try {
    decoded = await adminAuth().verifyIdToken(authorization.slice('Bearer '.length));
  } catch {
    return {
      ok: false,
      status: 401,
      code: 'unauthenticated',
      message: 'Sessão Firebase inválida.',
    };
  }

  if (
    !isAuthorizedAdmin(
      decoded.uid,
      decoded.firebase?.sign_in_provider,
      parseAdminUids(process.env.POE_ADMIN_UIDS),
    )
  ) {
    return {
      ok: false,
      status: 403,
      code: 'admin-forbidden',
      message: 'Acesso administrativo não autorizado.',
    };
  }

  return { ok: true, uid: decoded.uid };
}
