import { onRequest } from 'firebase-functions/v2/https';
import { adminAuth } from '../services/firebase-admin';
import { parseCostGuardPayload } from '../model/cost-protection';
import { FirestoreOperationalBudget } from '../services/operational-budget';

export const reserveOperationalCost = onRequest(async (request, response) => {
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
  try {
    await adminAuth().verifyIdToken(authorization.slice('Bearer '.length));
  } catch {
    response.status(401).json({ code: 'unauthenticated', message: 'Sessão Firebase inválida.' });
    return;
  }
  const payload = parseCostGuardPayload(request.body);
  if (!payload) {
    response.status(400).json({
      code: 'invalid-request',
      message: 'Informe uma operação e requestId válidos.',
    });
    return;
  }
  try {
    const result = await new FirestoreOperationalBudget().reserve(
      payload.operation,
      payload.requestId,
    );
    response.status(200).json(result);
  } catch {
    response.status(503).json({
      code: 'cost-guard-unavailable',
      message: 'Não foi possível consultar a proteção de custo. Tente novamente.',
    });
  }
});
