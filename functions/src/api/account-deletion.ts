import { onRequest } from 'firebase-functions/v2/https';
import { adminAuth, adminFirestore } from '../services/firebase-admin';
import {
  ACCOUNT_DELETION_STATUSES,
  createAccountDeletionRecord,
  isAccountDeletionPayload,
  toAccountDeletionReceipt,
  type AccountDeletionStatus,
  type AccountDeletionRecord,
} from '../model/account-deletion';

function recordFromData(value: unknown): AccountDeletionRecord | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  const candidate = value as Partial<AccountDeletionRecord>;
  if (
    typeof candidate.uid !== 'string' ||
    !ACCOUNT_DELETION_STATUSES.includes(candidate.status as AccountDeletionStatus) ||
    typeof candidate.requestedAt !== 'string' ||
    typeof candidate.scheduledFor !== 'string'
  ) {
    return undefined;
  }
  return candidate as AccountDeletionRecord;
}

export const requestAccountDeletion = onRequest(async (request, response) => {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'POST') {
    response.status(405).json({ code: 'method-not-allowed', message: 'Use POST.' });
    return;
  }
  const authorization = request.get('authorization') ?? '';
  if (!authorization.startsWith('Bearer ')) {
    response.status(401).json({ code: 'unauthenticated', message: 'Sessão Firebase ausente.' });
    return;
  }
  let decoded;
  try {
    decoded = await adminAuth().verifyIdToken(authorization.slice('Bearer '.length));
  } catch {
    response.status(401).json({ code: 'unauthenticated', message: 'Sessão Firebase inválida.' });
    return;
  }
  if (decoded.firebase?.sign_in_provider !== 'google.com') {
    response.status(403).json({
      code: 'google-required',
      message: 'Somente uma conta Google pode solicitar a exclusão.',
    });
    return;
  }
  if (!isAccountDeletionPayload(request.body)) {
    response.status(400).json({
      code: 'invalid-request',
      message: 'Confirme a exclusão digitando DELETE.',
    });
    return;
  }

  try {
    const reference = adminFirestore().doc(`accountDeletionRequests/${decoded.uid}`);
    const existingSnapshot = await reference.get();
    const existing = recordFromData(existingSnapshot.data());
    const record = createAccountDeletionRecord(decoded.uid, new Date(), existing);
    await adminAuth().revokeRefreshTokens(decoded.uid);
    await reference.set(record, { merge: true });
    response.status(202).json(toAccountDeletionReceipt(record));
  } catch {
    response.status(503).json({
      code: 'deletion-unavailable',
      message: 'Não foi possível registrar a exclusão. Tente novamente.',
    });
  }
});
