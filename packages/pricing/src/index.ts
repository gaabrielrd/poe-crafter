import type { ActiveLeague } from '@poe-crafter/shared-types';

export interface PriceProviderLeague {
  id?: unknown;
  name?: unknown;
  platform?: unknown;
  realm?: unknown;
  type?: unknown;
  active?: unknown;
  end?: unknown;
}

export interface LeagueCatalog {
  leagues: ActiveLeague[];
  fetchedAt: string;
}

function recordsFromPayload(payload: unknown): PriceProviderLeague[] {
  if (Array.isArray(payload)) return payload.filter(isProviderLeague);
  if (!isRecord(payload) || !Array.isArray(payload.leagues)) return [];
  const rawLeagues: unknown[] = payload.leagues;
  return rawLeagues.filter(isProviderLeague);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isProviderLeague(value: unknown): value is PriceProviderLeague {
  return isRecord(value);
}

function isPc(record: PriceProviderLeague) {
  const rawPlatform = record.platform ?? record.realm ?? record.type;
  const platform = typeof rawPlatform === 'string' ? rawPlatform.toLowerCase() : '';
  return platform === '' || platform === 'pc' || platform === 'pcleague';
}

function isActive(record: PriceProviderLeague) {
  if (record.active === false) return false;
  if (typeof record.end === 'string' && record.end !== '') {
    const end = Date.parse(record.end);
    if (Number.isFinite(end) && end <= Date.now()) return false;
  }
  return true;
}

export function normalizeLeagueCatalog(
  payload: unknown,
  fetchedAt = new Date().toISOString(),
): LeagueCatalog {
  const seen = new Set<string>();
  const leagues = recordsFromPayload(payload).flatMap((record) => {
    const id = typeof record.id === 'string' ? record.id.trim() : '';
    const name = typeof record.name === 'string' ? record.name.trim() : '';
    if (!id || !name || !isPc(record) || !isActive(record) || seen.has(id)) return [];
    seen.add(id);
    return [{ id, name, platform: 'pc' as const }];
  });
  return { leagues, fetchedAt };
}
