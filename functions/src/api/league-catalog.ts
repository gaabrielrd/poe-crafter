import { onRequest } from 'firebase-functions/v2/https';
import { normalizeLeagueCatalog, type LeagueCatalog } from '@poe-crafter/pricing';

export const DEFAULT_LEAGUE_CATALOG_URL = 'https://poe.ninja/poe1/api/economy/leagues';

export interface LeagueCatalogLoaderOptions {
  fetchImpl?: typeof fetch;
  url?: string;
  now?: () => string;
}

export async function loadLeagueCatalog({
  fetchImpl = fetch,
  url = process.env.POE_LEAGUES_URL ?? DEFAULT_LEAGUE_CATALOG_URL,
  now = () => new Date().toISOString(),
}: LeagueCatalogLoaderOptions = {}): Promise<LeagueCatalog> {
  const providerResponse = await fetchImpl(url, {
    headers: {
      accept: 'application/json',
      'user-agent': 'poe-crafter/0.0.0 (league catalog; contact project owner)',
    },
  });
  if (!providerResponse.ok) {
    throw new Error(`Provider de ligas respondeu ${providerResponse.status}.`);
  }
  return normalizeLeagueCatalog(await providerResponse.json(), now());
}

export const getActiveLeagues = onRequest(async (request, response) => {
  response.setHeader('Cache-Control', 'public, max-age=300');
  if (request.method !== 'GET') {
    response.status(405).json({ code: 'method-not-allowed', message: 'Use GET.' });
    return;
  }

  try {
    response.status(200).json(await loadLeagueCatalog());
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Falha ao carregar o catálogo de ligas.';
    response.status(502).json({ code: 'league-catalog-unavailable', message });
  }
});
