export const ACCOUNT_DELETION_DELAY_MS = 24 * 60 * 60 * 1000;
export const ACCOUNT_DELETION_STATUSES = ['pending', 'processing', 'completed', 'failed'] as const;
export type AccountDeletionStatus = (typeof ACCOUNT_DELETION_STATUSES)[number];

export interface AccountDeletionRecord {
  uid: string;
  status: AccountDeletionStatus;
  requestedAt: string;
  scheduledFor: string;
  processingStartedAt?: string;
  completedAt?: string;
  failedAt?: string;
  failureMessage?: string;
}

export interface AccountDeletionReceipt {
  status: 'pending';
  requestedAt: string;
  scheduledFor: string;
}

export interface AccountDeletionCleanupDependencies {
  markProcessing(record: AccountDeletionRecord, now: string): Promise<void>;
  deleteCrafts(uid: string): Promise<void>;
  deleteScreenshots(uid: string): Promise<void>;
  deleteAuth(uid: string): Promise<void>;
  markCompleted(record: AccountDeletionRecord, now: string): Promise<void>;
  markFailed(record: AccountDeletionRecord, now: string, message: string): Promise<void>;
}

export function isAccountDeletionPayload(value: unknown): value is { confirmation: 'DELETE' } {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { confirmation?: unknown }).confirmation === 'DELETE'
  );
}

export function createAccountDeletionRecord(
  uid: string,
  now = new Date(),
  existing?: AccountDeletionRecord,
): AccountDeletionRecord {
  if (existing?.status === 'pending' || existing?.status === 'processing') return existing;
  const requestedAt = now.toISOString();
  return {
    uid,
    status: 'pending',
    requestedAt,
    scheduledFor: new Date(now.getTime() + ACCOUNT_DELETION_DELAY_MS).toISOString(),
  };
}

export function toAccountDeletionReceipt(record: AccountDeletionRecord): AccountDeletionReceipt {
  return {
    status: 'pending',
    requestedAt: record.requestedAt,
    scheduledFor: record.scheduledFor,
  };
}

export async function processAccountDeletionRecord(
  record: AccountDeletionRecord,
  dependencies: AccountDeletionCleanupDependencies,
  now = new Date(),
): Promise<'skipped' | 'completed' | 'failed'> {
  if (record.status !== 'pending' || Number.isNaN(Date.parse(record.scheduledFor)))
    return 'skipped';
  if (Date.parse(record.scheduledFor) > now.getTime()) return 'skipped';
  const startedAt = now.toISOString();
  try {
    await dependencies.markProcessing(record, startedAt);
    await dependencies.deleteCrafts(record.uid);
    await dependencies.deleteScreenshots(record.uid);
    await dependencies.deleteAuth(record.uid);
    await dependencies.markCompleted(record, new Date().toISOString());
    return 'completed';
  } catch (error: unknown) {
    await dependencies.markFailed(
      record,
      new Date().toISOString(),
      error instanceof Error ? error.message : 'Falha desconhecida durante a exclusão.',
    );
    return 'failed';
  }
}
