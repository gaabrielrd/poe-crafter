export const ADMIN_SUPPORT_SCHEMA_VERSION = 1 as const;

export interface AdminSupportCraft {
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

export interface AdminSupportResponse {
  schemaVersion: typeof ADMIN_SUPPORT_SCHEMA_VERSION;
  craft: AdminSupportCraft;
}

function isText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function isCraft(value: unknown): value is AdminSupportCraft {
  if (typeof value !== 'object' || value === null) return false;
  const craft = value as Partial<AdminSupportCraft>;
  return (
    isText(craft.id) &&
    isText(craft.ownerUid) &&
    craft.schemaVersion === 1 &&
    isText(craft.title) &&
    typeof craft.manualPricing === 'boolean' &&
    craft.status === 'confirmed' &&
    typeof craft.target === 'object' &&
    craft.target !== null &&
    isDate(craft.createdAt) &&
    isDate(craft.updatedAt)
  );
}

export function isAdminSupportResponse(value: unknown): value is AdminSupportResponse {
  if (typeof value !== 'object' || value === null) return false;
  const response = value as Partial<AdminSupportResponse>;
  return response.schemaVersion === ADMIN_SUPPORT_SCHEMA_VERSION && isCraft(response.craft);
}
