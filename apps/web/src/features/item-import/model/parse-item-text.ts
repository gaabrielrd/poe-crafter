import type { ItemAffix, NormalizedItemTarget } from '@poe-crafter/shared-types';

export const MAX_ITEM_TEXT_BYTES = 20 * 1024;

export type ItemImportErrorCode =
  'empty' | 'too-large' | 'multiple-items' | 'missing-base' | 'missing-item-level';

export interface ItemImportError {
  code: ItemImportErrorCode;
  message: string;
}

export interface ItemImportResult {
  item?: NormalizedItemTarget;
  error?: ItemImportError;
}

const HEADER_PATTERNS = [
  /^Armour:\s*\d+$/i,
  /^ArmourBasePercentile:\s*[\d.]+$/i,
  /^Energy Shield:\s*\d+$/i,
  /^EnergyShieldBasePercentile:\s*[\d.]+$/i,
  /^(Searing Exarch|Eater of Worlds) Item$/i,
  /^Crafted:\s*(true|false)$/i,
  /^(Prefix|Suffix):/i,
  /^CatalystQuality:\s*\d+$/i,
  /^Quality:\s*\d+$/i,
  /^Sockets:/i,
  /^LevelReq:\s*\d+$/i,
  /^ItemLevel:\s*\d+$/i,
  /^Rarity:/i,
  /^Implicits:\s*\d+$/i,
];

function isHeader(line: string) {
  return HEADER_PATTERNS.some((pattern) => pattern.test(line));
}

function numberAfter(line: string, pattern: RegExp): number | undefined {
  const match = line.match(pattern);
  return match?.[1] === undefined ? undefined : Number(match[1]);
}

function parseAffix(line: string, kind: 'prefix' | 'suffix'): ItemAffix | undefined {
  const match = line.match(/^(Prefix|Suffix):\s*(.*)$/i);
  if (match?.[1]?.toLowerCase() !== kind) return undefined;
  const rawValue = match[2];
  if (rawValue === undefined || rawValue.trim().toLowerCase() === 'none') return undefined;

  const raw = rawValue.trim();
  const range = numberAfter(raw, /^\{range:([\d.]+)\}/i);
  const tags = [...raw.matchAll(/\{tags:([^}]+)\}/gi)].flatMap((tag) => {
    const tagValue = tag[1];
    return tagValue
      ? tagValue
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean)
      : [];
  });
  const code = raw
    .replace(/^\{range:[^}]+\}/i, '')
    .replace(/\{tags:[^}]+\}/gi, '')
    .trim();

  return {
    raw: `${kind}: ${raw}`,
    ...(code ? { code } : {}),
    ...(range !== undefined && Number.isFinite(range) ? { range } : {}),
    tags,
    crafted: /\{crafted\}/i.test(raw),
    unveiled: /\{unveiled_mod\}/i.test(raw),
  };
}

function parseModifierLine(line: string) {
  return line.trim();
}

export function parseItemText(text: string): ItemImportResult {
  if (!text.trim()) {
    return { error: { code: 'empty', message: 'Cole o texto de um item para continuar.' } };
  }

  if (new TextEncoder().encode(text).length > MAX_ITEM_TEXT_BYTES) {
    return {
      error: {
        code: 'too-large',
        message: 'O texto do item deve ter no máximo 20 KB.',
      },
    };
  }

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const itemMarkers = lines.filter((line) => line.toLowerCase() === 'new item').length;
  if (itemMarkers > 1) {
    return {
      error: {
        code: 'multiple-items',
        message: 'Cole apenas um item por importação.',
      },
    };
  }

  const markerIndex = lines.findIndex((line) => line.toLowerCase() === 'new item');
  const baseIndex = markerIndex + 1;
  const baseName = lines[baseIndex];
  if (markerIndex < 0 || !baseName || isHeader(baseName)) {
    return {
      error: {
        code: 'missing-base',
        message: 'Não foi possível identificar a base do item.',
      },
    };
  }

  const target: NormalizedItemTarget = {
    baseName,
    influences: [],
    crafted: false,
    prefixes: [],
    suffixes: [],
    implicits: [],
    explicits: [],
    unparsedLines: [],
  };
  let implicitCount = 0;
  let modifiersStart = -1;

  for (let index = baseIndex + 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (line === undefined) continue;
    if (/^Implicits:\s*\d+$/i.test(line)) {
      implicitCount = numberAfter(line, /^Implicits:\s*(\d+)$/i) ?? 0;
      modifiersStart = index + 1;
      continue;
    }

    const prefix = parseAffix(line, 'prefix');
    if (prefix) {
      target.prefixes.push(prefix);
      continue;
    }
    const suffix = parseAffix(line, 'suffix');
    if (suffix) {
      target.suffixes.push(suffix);
      continue;
    }
    if (/^Searing Exarch Item$/i.test(line)) {
      target.influences.push('searing-exarch');
      continue;
    }
    if (/^Eater of Worlds Item$/i.test(line)) {
      target.influences.push('eater-of-worlds');
      continue;
    }
    if (/^Crafted:\s*true$/i.test(line)) {
      target.crafted = true;
      continue;
    }

    type NumericField =
      | 'armour'
      | 'armourBasePercentile'
      | 'energyShield'
      | 'energyShieldBasePercentile'
      | 'itemLevel'
      | 'levelReq'
      | 'catalystQuality'
      | 'quality';
    const assignments: Array<[RegExp, NumericField]> = [
      [/^Armour:\s*(\d+)$/i, 'armour'],
      [/^ArmourBasePercentile:\s*([\d.]+)$/i, 'armourBasePercentile'],
      [/^Energy Shield:\s*(\d+)$/i, 'energyShield'],
      [/^EnergyShieldBasePercentile:\s*([\d.]+)$/i, 'energyShieldBasePercentile'],
      [/^ItemLevel:\s*(\d+)$/i, 'itemLevel'],
      [/^LevelReq:\s*(\d+)$/i, 'levelReq'],
      [/^CatalystQuality:\s*(\d+)$/i, 'catalystQuality'],
      [/^Quality:\s*(\d+)$/i, 'quality'],
    ];
    const assignment = assignments.find(([pattern]) => pattern.test(line));
    if (assignment) {
      const value = numberAfter(line, assignment[0]);
      if (value !== undefined) target[assignment[1]] = value;
      continue;
    }
    if (/^Rarity:\s*(.+)$/i.test(line)) {
      target.rarity = line.replace(/^Rarity:\s*/i, '');
      continue;
    }
    if (/^Sockets:\s*(.+)$/i.test(line)) {
      target.sockets = line.replace(/^Sockets:\s*/i, '');
      continue;
    }

    if (modifiersStart !== -1 && index >= modifiersStart) {
      const modifier = parseModifierLine(line);
      if (modifier) {
        if (target.implicits.length < implicitCount) target.implicits.push(modifier);
        else target.explicits.push(modifier);
      }
      continue;
    }
    if (!isHeader(line)) target.unparsedLines.push(line);
  }

  if (target.itemLevel === undefined) {
    return {
      item: target,
      error: {
        code: 'missing-item-level',
        message: 'O item level não foi encontrado. Informe-o antes de confirmar o alvo.',
      },
    };
  }
  return { item: target };
}
