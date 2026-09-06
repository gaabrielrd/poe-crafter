import { onRequest } from 'firebase-functions/v2/https';
import { adminFirestore } from '../services/firebase-admin';
import { normalizeAdminOverview } from '../model/admin-operations';
import { authenticateAdmin } from './admin-auth';

async function readSources() {
  const database = adminFirestore();
  const [league, dataset, priceSnapshot, jobs] = await Promise.all([
    database.doc('ops/leagueCatalog').get(),
    database.doc('ops/activeDataset').get(),
    database.doc('ops/priceSnapshot').get(),
    database.collection('ops/jobs').orderBy('updatedAt', 'desc').limit(50).get(),
  ]);
  return {
    activeLeague: league.data(),
    dataset: dataset.data(),
    priceSnapshot: priceSnapshot.data(),
    jobs: jobs.docs.map((document) => ({ id: document.id, ...document.data() })),
  };
}

export const getAdminOverview = onRequest(async (request, response) => {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'GET') {
    response.status(405).json({ code: 'method-not-allowed', message: 'Use GET.' });
    return;
  }

  const authorization = await authenticateAdmin(request);
  if (!authorization.ok) {
    response
      .status(authorization.status)
      .json({ code: authorization.code, message: authorization.message });
    return;
  }

  try {
    response.status(200).json(normalizeAdminOverview(await readSources()));
  } catch {
    response.status(503).json({
      code: 'admin-overview-unavailable',
      message: 'Não foi possível carregar o diagnóstico operacional.',
    });
  }
});
