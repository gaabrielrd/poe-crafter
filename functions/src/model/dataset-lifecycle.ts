import { validatePlannerDataset, type PlannerDatasetIssue } from '@poe-crafter/planner';

export const ADMIN_DATASET_SCHEMA_VERSION = 1 as const;
export const DATASET_STATUSES = ['imported', 'validated', 'active', 'retired', 'failed'] as const;
export type DatasetStatus = (typeof DATASET_STATUSES)[number];
export const DATASET_ACTIONS = ['import', 'validate', 'publish', 'reactivate'] as const;
export type DatasetAction = (typeof DATASET_ACTIONS)[number];

function withoutUndefined<T extends object>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T;
}

export interface AdminDatasetRecord {
  schemaVersion: typeof ADMIN_DATASET_SCHEMA_VERSION;
  version: string;
  status: DatasetStatus;
  dataset: unknown;
  importedAt: string;
  validatedAt?: string;
  activatedAt?: string;
  retiredAt?: string;
  failedAt?: string;
  validationIssues?: readonly PlannerDatasetIssue[];
}

export interface DatasetAuditEvent {
  schemaVersion: typeof ADMIN_DATASET_SCHEMA_VERSION;
  actorUid: string;
  action: DatasetAction;
  version: string;
  result: 'accepted' | 'rejected';
  createdAt: string;
  issueCount?: number;
}

export interface DatasetActionPayload {
  action: DatasetAction;
  version: string;
  dataset?: unknown;
}

export function isDatasetVersion(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(value);
}

export function parseDatasetActionPayload(value: unknown): DatasetActionPayload | null {
  if (typeof value !== 'object' || value === null) return null;
  const candidate = value as Partial<DatasetActionPayload>;
  if (!DATASET_ACTIONS.includes(candidate.action as DatasetAction)) return null;
  if (!isDatasetVersion(candidate.version)) return null;
  if (
    candidate.action === 'import' &&
    (typeof candidate.dataset !== 'object' || candidate.dataset === null)
  ) {
    return null;
  }
  return {
    action: candidate.action as DatasetAction,
    version: candidate.version,
    dataset: candidate.dataset,
  };
}

export function createImportedDatasetRecord(
  version: string,
  dataset: unknown,
  now = new Date(),
): AdminDatasetRecord {
  if (!isDatasetVersion(version)) throw new Error('Identificador de dataset inválido.');
  return {
    schemaVersion: ADMIN_DATASET_SCHEMA_VERSION,
    version,
    status: 'imported',
    dataset,
    importedAt: now.toISOString(),
  };
}

export function validateDatasetRecord(
  record: AdminDatasetRecord,
  now = new Date(),
): { record: AdminDatasetRecord; issues: readonly PlannerDatasetIssue[] } {
  const validation = validatePlannerDataset(record.dataset);
  if (validation.valid) {
    return {
      record: withoutUndefined({
        ...record,
        status: 'validated',
        validatedAt: now.toISOString(),
        failedAt: undefined,
        validationIssues: undefined,
      }),
      issues: [],
    };
  }
  return {
    record: withoutUndefined({
      ...record,
      status: 'failed',
      failedAt: now.toISOString(),
      validationIssues: validation.issues,
      validatedAt: undefined,
      activatedAt: undefined,
    }),
    issues: validation.issues,
  };
}

export function canActivateDataset(record: AdminDatasetRecord): boolean {
  return record.status === 'validated' || record.status === 'retired';
}

export function activateDataset(
  record: AdminDatasetRecord,
  action: 'publish' | 'reactivate',
  now = new Date(),
): AdminDatasetRecord {
  if (!canActivateDataset(record)) {
    throw new Error(`Dataset ${record.version} precisa estar validado antes de ser ativado.`);
  }
  return {
    ...withoutUndefined({
      ...record,
      status: 'active',
      activatedAt: now.toISOString(),
      retiredAt: undefined,
      validationIssues: undefined,
    }),
    // Keep the action visible to callers without changing the persisted schema.
    ...(action === 'reactivate' ? { validatedAt: record.validatedAt ?? now.toISOString() } : {}),
  };
}

export function retireDataset(record: AdminDatasetRecord, now = new Date()): AdminDatasetRecord {
  if (record.status !== 'active') return record;
  return { ...record, status: 'retired', retiredAt: now.toISOString() };
}

export function createDatasetAuditEvent(
  actorUid: string,
  action: DatasetAction,
  version: string,
  result: DatasetAuditEvent['result'],
  now = new Date(),
  issueCount?: number,
): DatasetAuditEvent {
  return {
    schemaVersion: ADMIN_DATASET_SCHEMA_VERSION,
    actorUid,
    action,
    version,
    result,
    createdAt: now.toISOString(),
    ...(issueCount === undefined ? {} : { issueCount }),
  };
}
