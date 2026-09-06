export const SUPPORT_ACCESS_SCHEMA_VERSION = 1 as const;
export const SUPPORT_ACCESS_ACTION = 'craft-support-access' as const;
export const SUPPORT_REASON_MAX_LENGTH = 500;

export interface SupportAccessPayload {
  craftId: string;
  reason: string;
}

export interface SupportAuditEvent {
  schemaVersion: typeof SUPPORT_ACCESS_SCHEMA_VERSION;
  actorUid: string;
  action: typeof SUPPORT_ACCESS_ACTION;
  craftId: string;
  reason: string;
  createdAt: string;
}

export interface SupportCraft {
  id: string;
  ownerUid: string;
  schemaVersion: 1;
  title: string;
  league: unknown;
  manualPricing: boolean;
  status: 'confirmed';
  target: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface SupportAccessResponse {
  schemaVersion: typeof SUPPORT_ACCESS_SCHEMA_VERSION;
  craft: SupportCraft;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

export function isSupportCraftId(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value);
}

export function parseSupportAccessPayload(value: unknown): SupportAccessPayload | null {
  if (!isRecord(value) || !isSupportCraftId(value.craftId) || !isText(value.reason)) return null;
  const reason = value.reason.trim();
  if (reason.length > SUPPORT_REASON_MAX_LENGTH) return null;
  return { craftId: value.craftId, reason };
}

export function normalizeSupportCraft(id: string, value: unknown): SupportCraft | null {
  if (!isRecord(value)) return null;
  if (
    !isText(value.ownerUid) ||
    value.schemaVersion !== 1 ||
    !isText(value.title) ||
    typeof value.manualPricing !== 'boolean' ||
    value.status !== 'confirmed' ||
    !isRecord(value.target) ||
    !isIsoDate(value.createdAt) ||
    !isIsoDate(value.updatedAt)
  ) {
    return null;
  }
  return {
    id,
    ownerUid: value.ownerUid,
    schemaVersion: 1,
    title: value.title,
    league: value.league ?? null,
    manualPricing: value.manualPricing,
    status: 'confirmed',
    target: value.target,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

export function createSupportAuditEvent(
  actorUid: string,
  craftId: string,
  reason: string,
  now = new Date(),
): SupportAuditEvent {
  return {
    schemaVersion: SUPPORT_ACCESS_SCHEMA_VERSION,
    actorUid,
    action: SUPPORT_ACCESS_ACTION,
    craftId,
    reason,
    createdAt: now.toISOString(),
  };
}
