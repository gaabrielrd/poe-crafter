import type { ItemAffix, NormalizedItemTarget } from '@poe-crafter/shared-types';

export const CRAFTABILITY_SCHEMA_VERSION = 1 as const;
export const CRAFTING_ENGINE_VERSION = '0.1.0';
export const MAX_PREFIXES = 3;
export const MAX_SUFFIXES = 3;

export const CRAFTABILITY_STATUSES = ['accepted', 'rejected', 'unsupported'] as const;
export type CraftabilityStatus = (typeof CRAFTABILITY_STATUSES)[number];

export const CRAFTABILITY_CLASSIFICATIONS = ['required', 'optional', 'ignore'] as const;
export type CraftabilityClassification = (typeof CRAFTABILITY_CLASSIFICATIONS)[number];

export const CRAFTABILITY_CONFLICT_CODES = [
  'missing_base',
  'invalid_item_level',
  'unclassified_modifier',
  'empty_modifier',
  'unparsed_line',
  'prefix_limit_exceeded',
  'suffix_limit_exceeded',
  'unknown_influence',
  'unsupported_mechanic',
] as const;
export type CraftabilityConflictCode = (typeof CRAFTABILITY_CONFLICT_CODES)[number];

export interface CraftabilityTarget {
  item: NormalizedItemTarget;
  classifications: Record<string, string>;
}

export interface CraftabilityRequest {
  schemaVersion: typeof CRAFTABILITY_SCHEMA_VERSION;
  league: string | null;
  target: CraftabilityTarget;
  allowedMechanics?: string[];
}

export interface CraftabilityConflict {
  code: CraftabilityConflictCode;
  path: string;
  message: string;
}

export interface CraftabilityResult {
  schemaVersion: typeof CRAFTABILITY_SCHEMA_VERSION;
  engineVersion: typeof CRAFTING_ENGINE_VERSION;
  status: CraftabilityStatus;
  conflicts: CraftabilityConflict[];
}

const SUPPORTED_MECHANICS = new Set(['base', 'affixes', 'influences']);
const SUPPORTED_INFLUENCES = new Set(['searing-exarch', 'eater-of-worlds']);

interface ModifierEntry {
  id: string;
  path: string;
  value: string | ItemAffix;
}

function modifierEntries(item: NormalizedItemTarget): ModifierEntry[] {
  return [
    ...item.implicits.map((value, index) => ({
      id: `implicit-${index}`,
      path: `target.item.implicits[${index}]`,
      value,
    })),
    ...item.explicits.map((value, index) => ({
      id: `explicit-${index}`,
      path: `target.item.explicits[${index}]`,
      value,
    })),
    ...item.prefixes.map((value, index) => ({
      id: `prefix-${index}`,
      path: `target.item.prefixes[${index}]`,
      value,
    })),
    ...item.suffixes.map((value, index) => ({
      id: `suffix-${index}`,
      path: `target.item.suffixes[${index}]`,
      value,
    })),
  ];
}

function modifierText(value: string | ItemAffix) {
  return typeof value === 'string' ? value : value.raw;
}

function conflict(
  code: CraftabilityConflictCode,
  path: string,
  message: string,
): CraftabilityConflict {
  return { code, path, message };
}

function compareConflicts(left: CraftabilityConflict, right: CraftabilityConflict) {
  return left.path.localeCompare(right.path) || left.code.localeCompare(right.code);
}

export function evaluateCraftability(request: CraftabilityRequest): CraftabilityResult {
  const conflicts: CraftabilityConflict[] = [];
  const item = request.target.item;

  if (!item.baseName.trim()) {
    conflicts.push(
      conflict('missing_base', 'target.item.baseName', 'Informe o nome da base do item.'),
    );
  }
  const itemLevel = item.itemLevel;
  if (typeof itemLevel !== 'number' || !Number.isInteger(itemLevel) || itemLevel < 1) {
    conflicts.push(
      conflict(
        'invalid_item_level',
        'target.item.itemLevel',
        'O item level precisa ser um inteiro maior que zero.',
      ),
    );
  }

  for (const [index, line] of item.unparsedLines.entries()) {
    if (line.trim()) {
      conflicts.push(
        conflict(
          'unparsed_line',
          `target.item.unparsedLines[${index}]`,
          `Linha não reconhecida: ${line}`,
        ),
      );
    }
  }

  if (item.prefixes.length > MAX_PREFIXES) {
    conflicts.push(
      conflict(
        'prefix_limit_exceeded',
        'target.item.prefixes',
        `O item tem mais de ${MAX_PREFIXES} prefixes suportados.`,
      ),
    );
  }
  if (item.suffixes.length > MAX_SUFFIXES) {
    conflicts.push(
      conflict(
        'suffix_limit_exceeded',
        'target.item.suffixes',
        `O item tem mais de ${MAX_SUFFIXES} suffixes suportados.`,
      ),
    );
  }

  for (const [index, influence] of (item.influences as string[]).entries()) {
    if (!SUPPORTED_INFLUENCES.has(influence)) {
      conflicts.push(
        conflict(
          'unknown_influence',
          `target.item.influences[${index}]`,
          `A influência "${influence}" ainda não é suportada.`,
        ),
      );
    }
  }

  for (const [index, mechanic] of (request.allowedMechanics ?? []).entries()) {
    if (!SUPPORTED_MECHANICS.has(mechanic)) {
      conflicts.push(
        conflict(
          'unsupported_mechanic',
          `allowedMechanics[${index}]`,
          `A mecânica "${mechanic}" ainda não é suportada.`,
        ),
      );
    }
  }

  for (const entry of modifierEntries(item)) {
    const classification = request.target.classifications[entry.id];
    if (
      !classification ||
      !CRAFTABILITY_CLASSIFICATIONS.includes(classification as CraftabilityClassification)
    ) {
      conflicts.push(
        conflict(
          'unclassified_modifier',
          `target.classifications.${entry.id}`,
          'Classifique este modificador como Required, Optional ou Ignore.',
        ),
      );
    }
    if (!modifierText(entry.value).trim()) {
      conflicts.push(conflict('empty_modifier', entry.path, 'O modificador não pode ficar vazio.'));
    }
  }

  conflicts.sort(compareConflicts);
  const unsupported = conflicts.some(
    ({ code }) => code === 'unknown_influence' || code === 'unsupported_mechanic',
  );
  const status: CraftabilityStatus =
    conflicts.length === 0 ? 'accepted' : unsupported ? 'unsupported' : 'rejected';

  return {
    schemaVersion: CRAFTABILITY_SCHEMA_VERSION,
    engineVersion: CRAFTING_ENGINE_VERSION,
    status,
    conflicts,
  };
}
