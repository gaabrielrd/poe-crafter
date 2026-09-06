import type { ActiveLeague } from '@poe-crafter/shared-types';
import { env } from '@/shared/config';

export interface LeagueCatalogResponse {
  leagues: ActiveLeague[];
  fetchedAt: string;
}

export interface LeagueCatalogClientOptions {
  apiUrl?: string;
  fetchImpl?: typeof fetch;
}

const DEVELOPMENT_LEAGUES: ActiveLeague[] = [
  { id: 'standard', name: 'Standard', platform: 'pc' },
  { id: 'settlers', name: 'Settlers', platform: 'pc' },
];

function endpointFrom(apiUrl: string) {
  return `${apiUrl.replace(/\/$/, '')}/leagues`;
}

export async function loadLeagueCatalog({
  apiUrl = env.apiUrl,
  fetchImpl = fetch,
}: LeagueCatalogClientOptions = {}): Promise<LeagueCatalogResponse> {
  if (!apiUrl && !env.isProduction) {
    return { leagues: DEVELOPMENT_LEAGUES, fetchedAt: new Date().toISOString() };
  }
  if (!apiUrl) {
    throw new Error('O catálogo de ligas não está configurado.');
  }

  const response = await fetchImpl(endpointFrom(apiUrl), {
    headers: { accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`O catálogo de ligas respondeu ${response.status}.`);
  const payload: unknown = await response.json();
  if (!isCatalogResponse(payload)) throw new Error('O catálogo de ligas retornou dados inválidos.');
  return payload;
}

function isCatalogResponse(value: unknown): value is LeagueCatalogResponse {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as { leagues?: unknown; fetchedAt?: unknown };
  return (
    Array.isArray(candidate.leagues) &&
    typeof candidate.fetchedAt === 'string' &&
    candidate.leagues.every(isActiveLeague)
  );
}

function isActiveLeague(value: unknown): value is ActiveLeague {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as { id?: unknown; name?: unknown; platform?: unknown };
  return (
    typeof candidate.id === 'string' &&
    candidate.id.length > 0 &&
    typeof candidate.name === 'string' &&
    candidate.name.length > 0 &&
    candidate.platform === 'pc'
  );
}
