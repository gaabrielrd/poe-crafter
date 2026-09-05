import { describe, expect, it } from 'vitest';
import { MAX_ITEM_TEXT_BYTES, parseItemText } from '../model/parse-item-text';

const DIVINE_CROWN = `New Item
Divine Crown
Armour: 1024
ArmourBasePercentile: 1
Energy Shield: 231
EnergyShieldBasePercentile: 1
Searing Exarch Item
Eater of Worlds Item
Crafted: true
Prefix: {range:0.261}IncreasedLife9
Prefix: {range:0.004}LocalIncreasedArmourAndEnergyShield6
Prefix: {range:0.433}LocalBaseArmourAndEnergyShield4
Suffix: None
Suffix: None
Suffix: {range:0.352}LightningResist8
CatalystQuality: 20
Quality: 20
Sockets: B-B-B-B
LevelReq: 84
Implicits: 2
{tags:caster,speed}{exarch}10% increased Cast Speed
{tags:resource,mana}{eater}8% increased Mana Reservation Efficiency of Skills
+65 to Armour
80% increased Armour and Energy Shield
+25 to maximum Energy Shield
+134 to maximum Life
+47% to Lightning Resistance
{tags:chaos,resistance}{custom}{range:0.756}+(31-35)% to Chaos Resistance
{tags:unveiled_mod,attribute}{crafted}{range:1}+(21-25) to Strength and Dexterity`;

describe('parseItemText', () => {
  it('normaliza o formato de item fornecido', () => {
    const result = parseItemText(DIVINE_CROWN);
    expect(result.error?.code).toBe('missing-item-level');
    expect(result.item).toMatchObject({
      baseName: 'Divine Crown',
      armour: 1024,
      energyShield: 231,
      influences: ['searing-exarch', 'eater-of-worlds'],
      crafted: true,
      quality: 20,
      sockets: 'B-B-B-B',
      levelReq: 84,
      implicits: [
        '{tags:caster,speed}{exarch}10% increased Cast Speed',
        '{tags:resource,mana}{eater}8% increased Mana Reservation Efficiency of Skills',
      ],
    });
    expect(result.item?.prefixes[0]).toMatchObject({ code: 'IncreasedLife9', range: 0.261 });
    expect(result.item?.suffixes[0]).toMatchObject({ code: 'LightningResist8', range: 0.352 });
    expect(result.item?.explicits).toHaveLength(7);
  });

  it('aceita item level e retorna sucesso', () => {
    const result = parseItemText(
      DIVINE_CROWN.replace('LevelReq: 84', 'ItemLevel: 86\nLevelReq: 84'),
    );
    expect(result.error).toBeUndefined();
    expect(result.item?.itemLevel).toBe(86);
  });

  it.each([
    ['', 'empty'],
    ['New Item\nDivine Crown\nNew Item\nIron Ring', 'multiple-items'],
    ['New Item\nArmour: 10', 'missing-base'],
  ])('rejeita entrada inválida (%s)', (text, code) => {
    expect(parseItemText(text).error?.code).toBe(code);
  });

  it('rejeita texto acima de 20 KB', () => {
    expect(
      parseItemText(`New Item\nDivine Crown\n${'x'.repeat(MAX_ITEM_TEXT_BYTES)}`).error?.code,
    ).toBe('too-large');
  });
});
