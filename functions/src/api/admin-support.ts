import { onRequest } from 'firebase-functions/v2/https';
import { adminFirestore } from '../services/firebase-admin';
import { authenticateAdmin } from './admin-auth';
import {
  createSupportAuditEvent,
  normalizeSupportCraft,
  parseSupportAccessPayload,
  type SupportAccessResponse,
} from '../model/support-access';

const AUDIT_COLLECTION = 'ops/supportAuditEvents';

export const requestAdminCraftSupport = onRequest(async (request, response) => {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'POST') {
    response.status(405).json({ code: 'method-not-allowed', message: 'Use POST.' });
    return;
  }

  const authorization = await authenticateAdmin(request);
  if (!authorization.ok) {
    response
      .status(authorization.status)
      .json({ code: authorization.code, message: authorization.message });
    return;
  }

  const payload = parseSupportAccessPayload(request.body);
  if (!payload) {
    response.status(400).json({
      code: 'invalid-support-request',
      message: 'Informe um craftId válido e uma justificativa de até 500 caracteres.',
    });
    return;
  }

  try {
    const database = adminFirestore();
    const result = await database.runTransaction(async (transaction) => {
      const craftReference = database.doc(`crafts/${payload.craftId}`);
      const snapshot = await transaction.get(craftReference);
      if (!snapshot.exists) return { missing: true as const };
      const craft = normalizeSupportCraft(payload.craftId, snapshot.data());
      if (!craft) return { invalid: true as const };
      transaction.create(
        database.collection(AUDIT_COLLECTION).doc(),
        createSupportAuditEvent(authorization.uid, payload.craftId, payload.reason),
      );
      return { craft };
    });

    if ('missing' in result) {
      response.status(404).json({ code: 'craft-not-found', message: 'Craft não encontrado.' });
      return;
    }
    if ('invalid' in result) {
      response
        .status(422)
        .json({ code: 'craft-invalid', message: 'O craft armazenado é inválido.' });
      return;
    }
    const body: SupportAccessResponse = { schemaVersion: 1, craft: result.craft };
    response.status(200).json(body);
  } catch {
    response.status(503).json({
      code: 'support-access-unavailable',
      message: 'Não foi possível registrar o acesso de suporte. Tente novamente.',
    });
  }
});
