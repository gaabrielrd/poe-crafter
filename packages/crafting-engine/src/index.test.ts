/* eslint-disable @typescript-eslint/no-floating-promises */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CRAFTABILITY_SCHEMA_VERSION,
  CRAFTING_ENGINE_VERSION,
  evaluateCraftability,
  type CraftabilityRequest,
} from './index.ts';
import type { NormalizedItemTarget } from '@poe-crafter/shared-types';

function target(overrides: Partial<NormalizedItemTarget> = {}): NormalizedItemTarget {
  return {
    baseName: 'Divine Crown',
    itemLevel: 84,
    influences: ['searing-exarch', 'eater-of-worlds'],
    crafted: true,
    prefixes: [{ raw: 'Increased Life', tags: ['life'], crafted: false, unveiled: false }],
    suffixes: [
      { raw: 'Lightning Resistance', tags: ['resistance'], crafted: false, unveiled: false },
    ],
    implicits: ['10% increased Cast Speed'],
    explicits: ['+134 to maximum Life'],
    unparsedLines: [],
    ...overrides,
  };
}

function request(
  itemOverrides: Partial<NormalizedItemTarget> = {},
  classifications: Record<string, string> = {
    'implicit-0': 'required',
    'explicit-0': 'required',
    'prefix-0': 'required',
    'suffix-0': 'optional',
  },
): CraftabilityRequest {
  return {
    schemaVersion: CRAFTABILITY_SCHEMA_VERSION,
    league: 'standard',
    target: { item: target(itemOverrides), classifications },
  };
}

describe('crafting-engine', () => {
  it('aceita o exemplo mínimo de Divine Crown', () => {
    const result = evaluateCraftability(request());

    assert.deepEqual(result, {
      schemaVersion: 1,
      engineVersion: CRAFTING_ENGINE_VERSION,
      status: 'accepted',
      conflicts: [],
    });
  });

  it('rejeita campos inválidos e conflitos ordenados', () => {
    const result = evaluateCraftability(
      request({ baseName: ' ', itemLevel: 0, unparsedLines: ['Unknown line'] }, {}),
    );

    assert.equal(result.status, 'rejected');
    assert.deepEqual(
      result.conflicts.map(({ code }) => code),
      [
        'unclassified_modifier',
        'unclassified_modifier',
        'unclassified_modifier',
        'unclassified_modifier',
        'missing_base',
        'invalid_item_level',
        'unparsed_line',
      ],
    );
  });

  it('identifica limites de affixes', () => {
    const result = evaluateCraftability(
      request({
        prefixes: [
          { raw: '1', tags: [], crafted: false, unveiled: false },
          { raw: '2', tags: [], crafted: false, unveiled: false },
          { raw: '3', tags: [], crafted: false, unveiled: false },
          { raw: '4', tags: [], crafted: false, unveiled: false },
        ],
        suffixes: [
          { raw: '1', tags: [], crafted: false, unveiled: false },
          { raw: '2', tags: [], crafted: false, unveiled: false },
          { raw: '3', tags: [], crafted: false, unveiled: false },
          { raw: '4', tags: [], crafted: false, unveiled: false },
        ],
      }),
    );

    assert.ok(result.conflicts.some(({ code }) => code === 'prefix_limit_exceeded'));
    assert.ok(result.conflicts.some(({ code }) => code === 'suffix_limit_exceeded'));
  });

  it('retorna unsupported para influência ou mecânica desconhecida', () => {
    const result = evaluateCraftability(
      request(
        { influences: ['unknown-influence' as never] },
        {
          'implicit-0': 'required',
          'explicit-0': 'required',
          'prefix-0': 'required',
          'suffix-0': 'optional',
        },
      ),
    );
    const withMechanic = evaluateCraftability({ ...request(), allowedMechanics: ['essence'] });

    assert.equal(result.status, 'unsupported');
    assert.equal(result.conflicts[0]?.code, 'unknown_influence');
    assert.equal(withMechanic.status, 'unsupported');
    assert.equal(withMechanic.conflicts[0]?.code, 'unsupported_mechanic');
  });

  it('produz o mesmo resultado para a mesma entrada', () => {
    const first = evaluateCraftability(request());
    const second = evaluateCraftability(
      JSON.parse(JSON.stringify(request())) as CraftabilityRequest,
    );

    assert.deepEqual(first, second);
  });
});
