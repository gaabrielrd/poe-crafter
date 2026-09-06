import type { ActiveLeague, ItemAffix, NormalizedItemTarget } from '@poe-crafter/shared-types';

export const CRAFT_SCHEMA_VERSION = 1 as const;
export const CRAFT_STATUSES = ['confirmed'] as const;
export type CraftStatus = (typeof CRAFT_STATUSES)[number];
export const CRAFT_CLASSIFICATIONS = ['required', 'optional', 'ignore'] as const;
export type CraftClassification = (typeof CRAFT_CLASSIFICATIONS)[number];

export interface PersistedCraftTarget {
  item: NormalizedItemTarget;
  classifications: Record<string, CraftClassification>;
}

export interface CraftRecord {
  id: string;
  ownerUid: string;
  schemaVersion: typeof CRAFT_SCHEMA_VERSION;
  title: string;
  league: ActiveLeague | null;
  manualPricing: boolean;
  status: CraftStatus;
  target: PersistedCraftTarget;
  createdAt: string;
  updatedAt: string;
}

export interface CraftInput {
  title?: string;
  league: ActiveLeague | null;
  manualPricing: boolean;
  target: PersistedCraftTarget;
}

export class CraftRecordValidationError extends Error {
  constructor(message: string) {
    super(`Craft inválido: ${message}`);
    this.name = 'CraftRecordValidationError';
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isItemAffix(value: unknown): value is ItemAffix {
  if (!isObject(value)) return false;
  return (
    typeof value.raw === 'string' &&
    (value.code === undefined || typeof value.code === 'string') &&
    (value.range === undefined || isFiniteNumber(value.range)) &&
    Array.isArray(value.tags) &&
    value.tags.every((tag) => typeof tag === 'string') &&
    typeof value.crafted === 'boolean' &&
    typeof value.unveiled === 'boolean'
  );
}

function isNormalizedItemTarget(value: unknown): value is NormalizedItemTarget {
  if (!isObject(value)) return false;
  const arrays = ['influences', 'prefixes', 'suffixes', 'implicits', 'explicits', 'unparsedLines'];
  if (!arrays.every((key) => Array.isArray(value[key]))) return false;
  const influences = value.influences as unknown[];
  const prefixes = value.prefixes as unknown[];
  const suffixes = value.suffixes as unknown[];
  const implicits = value.implicits as unknown[];
  const explicits = value.explicits as unknown[];
  const unparsedLines = value.unparsedLines as unknown[];
  return (
    typeof value.baseName === 'string' &&
    value.baseName.trim().length > 0 &&
    (value.itemLevel === undefined || isFiniteNumber(value.itemLevel)) &&
    (value.rarity === undefined || typeof value.rarity === 'string') &&
    (value.armour === undefined || isFiniteNumber(value.armour)) &&
    (value.armourBasePercentile === undefined || isFiniteNumber(value.armourBasePercentile)) &&
    (value.energyShield === undefined || isFiniteNumber(value.energyShield)) &&
    (value.energyShieldBasePercentile === undefined ||
      isFiniteNumber(value.energyShieldBasePercentile)) &&
    influences.every(
      (influence) => influence === 'searing-exarch' || influence === 'eater-of-worlds',
    ) &&
    typeof value.crafted === 'boolean' &&
    prefixes.every(isItemAffix) &&
    suffixes.every(isItemAffix) &&
    implicits.every((line) => typeof line === 'string') &&
    explicits.every((line) => typeof line === 'string') &&
    unparsedLines.every((line) => typeof line === 'string')
  );
}

function isPersistedTarget(value: unknown): value is PersistedCraftTarget {
  if (!isObject(value) || !isNormalizedItemTarget(value.item) || !isObject(value.classifications)) {
    return false;
  }
  return Object.values(value.classifications).every((classification) =>
    CRAFT_CLASSIFICATIONS.includes(classification as CraftClassification),
  );
}

function isLeague(value: unknown): value is ActiveLeague {
  return (
    isObject(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    value.platform === 'pc'
  );
}

export function validateCraftRecord(value: unknown): CraftRecord {
  if (!isObject(value)) throw new CraftRecordValidationError('documento ausente');
  if (typeof value.id !== 'string' || !value.id) {
    throw new CraftRecordValidationError('id ausente');
  }
  if (typeof value.ownerUid !== 'string' || !value.ownerUid) {
    throw new CraftRecordValidationError('ownerUid ausente');
  }
  if (value.schemaVersion !== CRAFT_SCHEMA_VERSION) {
    throw new CraftRecordValidationError('schemaVersion desconhecida');
  }
  if (typeof value.title !== 'string' || !value.title.trim()) {
    throw new CraftRecordValidationError('título ausente');
  }
  if (value.league !== null && !isLeague(value.league)) {
    throw new CraftRecordValidationError('liga inválida');
  }
  if (typeof value.manualPricing !== 'boolean' || value.status !== 'confirmed') {
    throw new CraftRecordValidationError('estado inválido');
  }
  if (!isPersistedTarget(value.target)) {
    throw new CraftRecordValidationError('alvo ou classificações inválidos');
  }
  if (
    typeof value.createdAt !== 'string' ||
    Number.isNaN(Date.parse(value.createdAt)) ||
    typeof value.updatedAt !== 'string' ||
    Number.isNaN(Date.parse(value.updatedAt))
  ) {
    throw new CraftRecordValidationError('timestamp inválido');
  }
  return value as unknown as CraftRecord;
}

export function createCraftInput(
  target: PersistedCraftTarget,
  league: ActiveLeague | null,
  manualPricing: boolean,
  title = target.item.baseName,
): CraftInput {
  return { target, league, manualPricing, title: title.trim() || target.item.baseName };
}
