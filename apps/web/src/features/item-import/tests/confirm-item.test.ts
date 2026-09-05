import { describe, expect, it } from 'vitest';
import { confirmItemDraft, createItemDraft, validateItemDraft } from '../model/confirm-item';
import { parseItemText } from '../model/parse-item-text';

const ITEM_TEXT = `New Item
Divine Crown
ItemLevel: 86
Prefix: {range:0.2}IncreasedLife9
Implicits: 1
10% increased Cast Speed
+100 to maximum Life`;

function draft() {
  const parsed = parseItemText(ITEM_TEXT);
  if (!parsed.item) throw new Error('fixture inválida');
  return createItemDraft(parsed.item);
}

describe('confirmItemDraft', () => {
  it('rejeita classificações incompletas', () => {
    const issues = validateItemDraft(draft());
    expect(issues.some((issue) => issue.field === 'modifier-implicit-0')).toBe(true);
    expect(issues.some((issue) => issue.field === 'modifier-prefix-0')).toBe(true);
  });

  it('produz alvo confirmado com correção e classificações', () => {
    const next = draft();
    next.fields.baseName = 'Hubris Circlet';
    next.modifiers.forEach((modifier, index) => {
      modifier.classification = index === 0 ? 'required' : 'optional';
    });
    const result = confirmItemDraft(next);
    expect('item' in result).toBe(true);
    if (!('item' in result)) return;
    expect(result.item.item.baseName).toBe('Hubris Circlet');
    expect(result.item.classifications['implicit-0']).toBe('required');
  });

  it('mantém bloqueio quando prefix ou suffix reconhecido é editado', () => {
    const next = draft();
    next.modifiers.forEach((modifier) => {
      modifier.classification = 'ignore';
    });
    next.modifiers.find((modifier) => modifier.source === 'prefix')!.text = 'texto novo';
    const result = confirmItemDraft(next);
    expect('issues' in result && result.issues[0]?.message).toContain('Reimporte');
  });
});
