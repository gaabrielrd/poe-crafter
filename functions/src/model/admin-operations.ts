export const ADMIN_OVERVIEW_SCHEMA_VERSION = 1 as const;
export const ADMIN_JOB_STATUSES = ['queued', 'running', 'succeeded', 'failed'] as const;
export type AdminJobStatus = (typeof ADMIN_JOB_STATUSES)[number];

export interface AdminDatasetStatus {
  version: string;
  status: 'active' | 'failed';
  updatedAt: string;
  source?: string;
}

export interface AdminPriceSnapshot {
  id: string;
  status: 'active' | 'stale' | 'failed';
  fetchedAt: string;
  league?: string;
}

export interface AdminLeague {
  id: string;
  name: string;
  platform: 'pc';
}

export interface AdminJobFailure {
  id: string;
  type: string;
  status: 'failed';
  updatedAt: string;
  errorMessage: string;
}

export interface AdminOverview {
  schemaVersion: typeof ADMIN_OVERVIEW_SCHEMA_VERSION;
  generatedAt: string;
  activeLeague: AdminLeague | null;
  dataset: AdminDatasetStatus | null;
  priceSnapshot: AdminPriceSnapshot | null;
  queue: {
    queued: number;
    running: number;
    failed: number;
  };
  recentFailures: readonly AdminJobFailure[];
}

export interface AdminOverviewSources {
  activeLeague?: unknown;
  dataset?: unknown;
  priceSnapshot?: unknown;
  jobs?: readonly unknown[];
}

export function parseAdminUids(raw: string | undefined): ReadonlySet<string> {
  return new Set(
    (raw ?? '')
      .split(',')
      .map((uid) => uid.trim())
      .filter(Boolean),
  );
}

export function isAuthorizedAdmin(
  uid: string,
  provider: string | undefined,
  adminUids: ReadonlySet<string>,
): boolean {
  return provider === 'google.com' && adminUids.has(uid);
}

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function isoDate(value: unknown): string | undefined {
  const candidate = text(value);
  return candidate && !Number.isNaN(Date.parse(candidate)) ? candidate : undefined;
}

function normalizeLeague(value: unknown): AdminLeague | null {
  const source = record(value);
  if (!source) return null;
  const id = text(source.id);
  const name = text(source.name);
  if (!id || !name || source.platform !== 'pc') return null;
  return { id, name, platform: 'pc' };
}

function normalizeDataset(value: unknown): AdminDatasetStatus | null {
  const source = record(value);
  if (!source) return null;
  const version = text(source.version);
  const updatedAt = isoDate(source.updatedAt);
  const status = source.status === 'active' || source.status === 'failed' ? source.status : null;
  if (!version || !updatedAt || !status) return null;
  const sourceName = text(source.source);
  return sourceName
    ? { version, status, updatedAt, source: sourceName }
    : { version, status, updatedAt };
}

function normalizePriceSnapshot(value: unknown): AdminPriceSnapshot | null {
  const source = record(value);
  if (!source) return null;
  const id = text(source.id);
  const fetchedAt = isoDate(source.fetchedAt);
  const status =
    source.status === 'active' || source.status === 'stale' || source.status === 'failed'
      ? source.status
      : null;
  if (!id || !fetchedAt || !status) return null;
  const league = text(source.league);
  return league ? { id, status, fetchedAt, league } : { id, status, fetchedAt };
}

function normalizeJobFailure(value: unknown): AdminJobFailure | null {
  const source = record(value);
  if (!source || source.status !== 'failed') return null;
  const id = text(source.id);
  const type = text(source.type);
  const updatedAt = isoDate(source.updatedAt);
  const errorMessage = text(source.errorMessage);
  if (!id || !type || !updatedAt || !errorMessage) return null;
  return { id, type, status: 'failed', updatedAt, errorMessage };
}

export function normalizeAdminOverview(
  sources: AdminOverviewSources,
  now = new Date(),
): AdminOverview {
  const jobs = sources.jobs ?? [];
  const queue = { queued: 0, running: 0, failed: 0 };
  const recentFailures: AdminJobFailure[] = [];

  for (const value of jobs) {
    const source = record(value);
    if (!source || !ADMIN_JOB_STATUSES.includes(source.status as AdminJobStatus)) continue;
    if (source.status === 'queued') queue.queued += 1;
    if (source.status === 'running') queue.running += 1;
    if (source.status === 'failed') {
      queue.failed += 1;
      const failure = normalizeJobFailure(value);
      if (failure) recentFailures.push(failure);
    }
  }

  recentFailures.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  return {
    schemaVersion: ADMIN_OVERVIEW_SCHEMA_VERSION,
    generatedAt: now.toISOString(),
    activeLeague: normalizeLeague(sources.activeLeague),
    dataset: normalizeDataset(sources.dataset),
    priceSnapshot: normalizePriceSnapshot(sources.priceSnapshot),
    queue,
    recentFailures: recentFailures.slice(0, 10),
  };
}
