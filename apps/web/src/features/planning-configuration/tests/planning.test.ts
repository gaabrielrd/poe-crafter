import { describe, expect, it } from 'vitest';
import {
  createPlanningRequest,
  PLANNING_REQUEST_SCHEMA_VERSION,
} from '@/features/planning-configuration';

const validDraft = {
  objective: 'recommended',
  excludedMechanics: ['fossil', 'essence'],
  priceOverrides: [
    { resource: 'Divine Orb', chaos: '150' },
    { resource: 'Essence of Loathing', chaos: '12.5' },
  ],
};

describe('planning request contract', () => {
  it('normaliza e ordena o request versionado', () => {
    const result = createPlanningRequest({
      ...validDraft,
      excludedMechanics: ['metacraft', 'essence'],
      priceOverrides: [...validDraft.priceOverrides].reverse(),
    });

    expect(result).toEqual({
      request: {
        schemaVersion: PLANNING_REQUEST_SCHEMA_VERSION,
        objective: 'recommended',
        excludedMechanics: ['essence', 'metacraft'],
        priceOverrides: [
          { resource: 'Divine Orb', chaos: 150 },
          { resource: 'Essence of Loathing', chaos: 12.5 },
        ],
      },
    });
  });

  it('bloqueia a exclusão de todas as mecânicas aplicáveis', () => {
    const result = createPlanningRequest({
      ...validDraft,
      excludedMechanics: ['essence', 'fossil', 'harvest', 'bench', 'metacraft'],
    });

    expect(result).toMatchObject({
      issues: [{ code: 'no_search_space', field: 'excludedMechanics' }],
    });
  });

  it('rejeita objetivo, duplicatas e preço inválidos', () => {
    const result = createPlanningRequest({
      objective: 'fast',
      excludedMechanics: ['essence', 'essence'],
      priceOverrides: [
        { resource: '', chaos: '-1' },
        { resource: 'Divine Orb', chaos: 'not-a-number' },
        { resource: 'divine orb', chaos: '10' },
      ],
    });

    expect(result).toMatchObject({
      issues: [
        { code: 'invalid_objective' },
        { code: 'duplicate_mechanic' },
        { code: 'empty_resource' },
        { code: 'invalid_price' },
        { code: 'invalid_price' },
        { code: 'duplicate_resource' },
      ],
    });
  });
});
