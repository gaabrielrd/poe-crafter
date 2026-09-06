import type { ItemAffix, ItemInfluence, NormalizedItemTarget } from '@poe-crafter/shared-types';

export const MODIFIER_CLASSIFICATIONS = ['required', 'optional', 'ignore'] as const;
export type ModifierClassification = (typeof MODIFIER_CLASSIFICATIONS)[number];

export type ModifierSource = 'implicit' | 'explicit' | 'prefix' | 'suffix';

export interface EditableModifier {
  id: string;
  source: ModifierSource;
  index: number;
  text: string;
  originalText: string;
  affix?: ItemAffix;
  classification: ModifierClassification | '';
}

export interface EditableItemFields {
  baseName: string;
  itemLevel: string;
  rarity: string;
  armour: string;
  armourBasePercentile: string;
  energyShield: string;
  energyShieldBasePercentile: string;
  catalystQuality: string;
  quality: string;
  sockets: string;
  levelReq: string;
  crafted: boolean;
  influences: ItemInfluence[];
}

export interface ItemDraft {
  source: NormalizedItemTarget;
  fields: EditableItemFields;
  modifiers: EditableModifier[];
}

export interface ConfirmedItemTarget {
  item: NormalizedItemTarget;
  classifications: Record<string, ModifierClassification>;
}

export interface ConfirmationIssue {
  field: string;
  message: string;
}

function optionalNumber(value: number | undefined) {
  return value === undefined ? '' : String(value);
}

function modifierText(value: string | ItemAffix) {
  return typeof value === 'string' ? value : value.raw;
}

function createModifiers(item: NormalizedItemTarget): EditableModifier[] {
  const groups: Array<[ModifierSource, Array<string | ItemAffix>]> = [
    ['implicit', item.implicits],
    ['explicit', item.explicits],
    ['prefix', item.prefixes],
    ['suffix', item.suffixes],
  ];

  return groups.flatMap(([source, values]) =>
    values.map((value, index) => {
      const text = modifierText(value);
      return {
        id: `${source}-${index}`,
        source,
        index,
        text,
        originalText: text,
        ...(typeof value === 'string' ? {} : { affix: value }),
        classification: '',
      };
    }),
  );
}

export function createItemDraft(item: NormalizedItemTarget): ItemDraft {
  return {
    source: item,
    fields: {
      baseName: item.baseName,
      itemLevel: optionalNumber(item.itemLevel),
      rarity: item.rarity ?? '',
      armour: optionalNumber(item.armour),
      armourBasePercentile: optionalNumber(item.armourBasePercentile),
      energyShield: optionalNumber(item.energyShield),
      energyShieldBasePercentile: optionalNumber(item.energyShieldBasePercentile),
      catalystQuality: optionalNumber(item.catalystQuality),
      quality: optionalNumber(item.quality),
      sockets: item.sockets ?? '',
      levelReq: optionalNumber(item.levelReq),
      crafted: item.crafted,
      influences: [...item.influences],
    },
    modifiers: createModifiers(item),
  };
}

export function createItemDraftFromConfirmed(target: ConfirmedItemTarget): ItemDraft {
  const draft = createItemDraft(target.item);
  return {
    ...draft,
    modifiers: draft.modifiers.map((modifier) => ({
      ...modifier,
      classification: target.classifications[modifier.id] ?? '',
    })),
  };
}

function parseOptionalNumber(value: string, field: string, issues: ConfirmationIssue[]) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) {
    issues.push({ field, message: 'Informe um número válido.' });
    return undefined;
  }
  return parsed;
}

function parseRequiredItemLevel(value: string, issues: ConfirmationIssue[]) {
  const parsed = Number(value.trim());
  if (!value.trim() || !Number.isInteger(parsed) || parsed < 1) {
    issues.push({ field: 'itemLevel', message: 'Informe um item level inteiro maior que zero.' });
    return undefined;
  }
  return parsed;
}

export function validateItemDraft(draft: ItemDraft): ConfirmationIssue[] {
  const issues: ConfirmationIssue[] = [];
  if (!draft.fields.baseName.trim()) {
    issues.push({ field: 'baseName', message: 'Informe o nome da base.' });
  }
  parseRequiredItemLevel(draft.fields.itemLevel, issues);
  for (const [field, value] of [
    ['armour', draft.fields.armour],
    ['armourBasePercentile', draft.fields.armourBasePercentile],
    ['energyShield', draft.fields.energyShield],
    ['energyShieldBasePercentile', draft.fields.energyShieldBasePercentile],
    ['catalystQuality', draft.fields.catalystQuality],
    ['quality', draft.fields.quality],
    ['levelReq', draft.fields.levelReq],
  ] as const) {
    parseOptionalNumber(value, field, issues);
  }
  for (const modifier of draft.modifiers) {
    if (!modifier.classification || !MODIFIER_CLASSIFICATIONS.includes(modifier.classification)) {
      issues.push({
        field: `modifier-${modifier.id}`,
        message: 'Escolha Required, Optional ou Ignore.',
      });
    }
    if (!modifier.text.trim()) {
      issues.push({
        field: `modifier-${modifier.id}`,
        message: 'O modificador não pode ficar vazio.',
      });
    }
    if (modifier.affix && modifier.text !== modifier.originalText) {
      issues.push({
        field: `modifier-${modifier.id}`,
        message: 'Reimporte o item para corrigir um prefix ou suffix reconhecido.',
      });
    }
  }
  for (const [index, line] of draft.source.unparsedLines.entries()) {
    if (line.trim()) {
      issues.push({ field: `unparsed-${index}`, message: `Linha não reconhecida: ${line}` });
    }
  }
  return issues;
}

function numberFrom(value: string) {
  const trimmed = value.trim();
  return trimmed ? Number(trimmed) : undefined;
}

export function confirmItemDraft(
  draft: ItemDraft,
): { item: ConfirmedItemTarget } | { issues: ConfirmationIssue[] } {
  const issues = validateItemDraft(draft);
  if (issues.length > 0) return { issues };

  const item: NormalizedItemTarget = {
    ...draft.source,
    baseName: draft.fields.baseName.trim(),
    itemLevel: Number(draft.fields.itemLevel),
    rarity: draft.fields.rarity.trim() || undefined,
    armour: numberFrom(draft.fields.armour),
    armourBasePercentile: numberFrom(draft.fields.armourBasePercentile),
    energyShield: numberFrom(draft.fields.energyShield),
    energyShieldBasePercentile: numberFrom(draft.fields.energyShieldBasePercentile),
    catalystQuality: numberFrom(draft.fields.catalystQuality),
    quality: numberFrom(draft.fields.quality),
    sockets: draft.fields.sockets.trim() || undefined,
    levelReq: numberFrom(draft.fields.levelReq),
    crafted: draft.fields.crafted,
    influences: [...draft.fields.influences],
    implicits: draft.modifiers
      .filter((modifier) => modifier.source === 'implicit')
      .map((modifier) => modifier.text.trim()),
    explicits: draft.modifiers
      .filter((modifier) => modifier.source === 'explicit')
      .map((modifier) => modifier.text.trim()),
  };
  const classifications = Object.fromEntries(
    draft.modifiers.map((modifier) => [
      modifier.id,
      modifier.classification as ModifierClassification,
    ]),
  );
  return { item: { item, classifications } };
}
