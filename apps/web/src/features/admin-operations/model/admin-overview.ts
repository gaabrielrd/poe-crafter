export const ADMIN_OVERVIEW_SCHEMA_VERSION = 1 as const;

export interface AdminOverview {
  schemaVersion: typeof ADMIN_OVERVIEW_SCHEMA_VERSION;
  generatedAt: string;
  activeLeague: {
    id: string;
    name: string;
    platform: 'pc';
  } | null;
  dataset: {
    version: string;
    status: 'active' | 'failed';
    updatedAt: string;
    source?: string;
  } | null;
  priceSnapshot: {
    id: string;
    status: 'active' | 'stale' | 'failed';
    fetchedAt: string;
    league?: string;
  } | null;
  queue: {
    queued: number;
    running: number;
    failed: number;
  };
  recentFailures: readonly {
    id: string;
    type: string;
    status: 'failed';
    updatedAt: string;
    errorMessage: string;
  }[];
}

function isDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isOverviewFailure(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const failure = value as Partial<AdminOverview['recentFailures'][number]>;
  return (
    isText(failure.id) &&
    isText(failure.type) &&
    failure.status === 'failed' &&
    isDate(failure.updatedAt) &&
    isText(failure.errorMessage)
  );
}

function isDataset(value: unknown): boolean {
  if (value === null) return true;
  if (typeof value !== 'object') return false;
  const dataset = value as Partial<NonNullable<AdminOverview['dataset']>>;
  return (
    isText(dataset.version) &&
    (dataset.status === 'active' || dataset.status === 'failed') &&
    isDate(dataset.updatedAt) &&
    (dataset.source === undefined || isText(dataset.source))
  );
}

function isPriceSnapshot(value: unknown): boolean {
  if (value === null) return true;
  if (typeof value !== 'object') return false;
  const snapshot = value as Partial<NonNullable<AdminOverview['priceSnapshot']>>;
  return (
    isText(snapshot.id) &&
    (snapshot.status === 'active' || snapshot.status === 'stale' || snapshot.status === 'failed') &&
    isDate(snapshot.fetchedAt) &&
    (snapshot.league === undefined || isText(snapshot.league))
  );
}

export function isAdminOverview(value: unknown): value is AdminOverview {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<AdminOverview>;
  if (
    candidate.schemaVersion !== ADMIN_OVERVIEW_SCHEMA_VERSION ||
    !isDate(candidate.generatedAt) ||
    typeof candidate.queue !== 'object' ||
    candidate.queue === null ||
    !Array.isArray(candidate.recentFailures)
  ) {
    return false;
  }
  if (
    candidate.activeLeague !== null &&
    (typeof candidate.activeLeague !== 'object' ||
      candidate.activeLeague === null ||
      !isText(candidate.activeLeague.id) ||
      !isText(candidate.activeLeague.name) ||
      candidate.activeLeague.platform !== 'pc')
  ) {
    return false;
  }
  return (
    isDataset(candidate.dataset) &&
    isPriceSnapshot(candidate.priceSnapshot) &&
    (['queued', 'running', 'failed'] as const).every(
      (key) => typeof candidate.queue?.[key] === 'number' && candidate.queue[key] >= 0,
    ) &&
    candidate.recentFailures.every(isOverviewFailure)
  );
}
