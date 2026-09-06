export const ADMIN_DATASET_ACTION_SCHEMA_VERSION = 1 as const;
export const ADMIN_DATASET_ACTIONS = ['import', 'validate', 'publish', 'reactivate'] as const;
export type AdminDatasetAction = (typeof ADMIN_DATASET_ACTIONS)[number];
export const ADMIN_DATASET_STATUSES = [
  'imported',
  'validated',
  'active',
  'retired',
  'failed',
] as const;
export type AdminDatasetStatus = (typeof ADMIN_DATASET_STATUSES)[number];

export interface AdminDatasetIssue {
  path: string;
  code: 'invalid-schema' | 'missing-field' | 'invalid-value';
  message: string;
}

export interface AdminDatasetActionResponse {
  schemaVersion: typeof ADMIN_DATASET_ACTION_SCHEMA_VERSION;
  action: AdminDatasetAction;
  version: string;
  status: AdminDatasetStatus;
  idempotent?: boolean;
  issues?: readonly AdminDatasetIssue[];
}

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isIssue(value: unknown): value is AdminDatasetIssue {
  if (typeof value !== 'object' || value === null) return false;
  const issue = value as Partial<AdminDatasetIssue>;
  return (
    typeof issue.path === 'string' &&
    (issue.code === 'invalid-schema' ||
      issue.code === 'missing-field' ||
      issue.code === 'invalid-value') &&
    isText(issue.message)
  );
}

export function isAdminDatasetActionResponse(value: unknown): value is AdminDatasetActionResponse {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<AdminDatasetActionResponse>;
  return (
    candidate.schemaVersion === ADMIN_DATASET_ACTION_SCHEMA_VERSION &&
    ADMIN_DATASET_ACTIONS.includes(candidate.action as AdminDatasetAction) &&
    isText(candidate.version) &&
    ADMIN_DATASET_STATUSES.includes(candidate.status as AdminDatasetStatus) &&
    (candidate.idempotent === undefined || typeof candidate.idempotent === 'boolean') &&
    (candidate.issues === undefined ||
      (Array.isArray(candidate.issues) && candidate.issues.every(isIssue)))
  );
}
