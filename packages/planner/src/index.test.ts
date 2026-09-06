/* eslint-disable @typescript-eslint/no-floating-promises */

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createPlannerPlanVersion,
  generateStrategies,
  MAX_STRATEGIES,
  PLANNER_JOB_TIMEOUT_MS,
  runPlannerJob,
  STARTER_PLANNER_DATASET,
  type PlannerInput,
  validatePlannerDataset,
} from './index.ts';

const target = {
  item: {
    baseName: 'Divine Crown',
    itemLevel: 86,
    influences: [],
    crafted: false,
    prefixes: [
      {
        raw: 'Prefix: IncreasedLife9',
        code: 'IncreasedLife9',
        tags: [],
        crafted: false,
        unveiled: false,
      },
    ],
    suffixes: [],
    implicits: [],
    explicits: [],
    unparsedLines: [],
  },
  classifications: { 'prefix-0': 'required' },
};

const input: PlannerInput = {
  request: {
    schemaVersion: 1,
    objective: 'recommended',
    excludedMechanics: [],
    priceOverrides: [],
  },
  target,
  craftability: { status: 'accepted' },
  dataset: STARTER_PLANNER_DATASET,
};

test('gera estratégias completas, ordenadas e vinculadas às versões', () => {
  const result = generateStrategies(input);
  assert.equal(result.phase, 'succeeded');
  assert.equal(result.strategies.length, 3);
  assert.equal(result.strategies[0]?.gameDataVersion, 'starter-0.1.0');
  assert.equal(result.strategies[0]?.steps[0]?.validation, 'accepted');
  assert.equal(result.strategies[0]?.target.baseName, 'Divine Crown');
  assert.match(result.strategies[0]?.steps[0]?.expectedState ?? '', /alvo/i);
  assert.ok((result.strategies[0]?.expectedCostChaos ?? 0) > 0);
});

test('valida datasets administrativos e retorna caminhos determinísticos', () => {
  assert.deepEqual(validatePlannerDataset(STARTER_PLANNER_DATASET), { valid: true, issues: [] });
  const result = validatePlannerDataset({
    schemaVersion: 2,
    gameDataVersion: '',
    priceSnapshotId: '',
    recipes: [
      {
        id: 'broken',
        label: 'Receita inválida',
        mechanics: ['bench'],
        requiredAffixCodes: [],
        minItemLevel: 0,
        steps: [],
      },
    ],
  });
  assert.equal(result.valid, false);
  assert.deepEqual(
    result.issues.map((issue) => issue.path),
    [
      'schemaVersion',
      'gameDataVersion',
      'priceSnapshotId',
      'recipes[0].minItemLevel',
      'recipes[0].steps',
    ],
  );
});

test('aplica exclusões, overrides e limite máximo', () => {
  const result = generateStrategies({
    ...input,
    request: {
      ...input.request,
      objective: 'cheapest',
      excludedMechanics: ['bench'],
      priceOverrides: [{ resource: 'Essence of Greed', chaos: 2 }],
    },
  });
  assert.ok(result.strategies.length <= MAX_STRATEGIES);
  assert.ok(Math.abs((result.strategies[0]?.expectedCostChaos ?? 0) - 2 * (1 / 0.35)) < 0.000001);
  assert.ok(result.omitted.ineligible >= 2);
});

test('recusa craftabilidade não aceita e ausência de caminho', () => {
  assert.equal(
    generateStrategies({ ...input, craftability: { status: 'unsupported' } }).issues[0]?.code,
    'craftability_not_accepted',
  );
  assert.equal(
    generateStrategies({
      ...input,
      target: { ...target, classifications: {} },
    }).issues[0]?.code,
    'no_valid_strategy',
  );
});

test('deduplica receitas equivalentes e publica todas as fases do job', async () => {
  const dataset = {
    ...STARTER_PLANNER_DATASET,
    recipes: [
      ...STARTER_PLANNER_DATASET.recipes,
      { ...STARTER_PLANNER_DATASET.recipes[0]!, id: 'bench-life-copy', label: 'Cópia' },
    ],
  };
  const phases: string[] = [];
  const result = await runPlannerJob(
    { ...input, dataset },
    { onUpdate: ({ phase }) => phases.push(phase) },
  );
  assert.deepEqual(phases, ['queued', 'validating', 'searching', 'simulating', 'succeeded']);
  assert.equal(result.omitted.equivalent, 1);
});

test('encerra job que ultrapassa o deadline sem publicar estratégias', async () => {
  let elapsed = 0;
  const phases: string[] = [];
  const result = await runPlannerJob(input, {
    timeoutMs: PLANNER_JOB_TIMEOUT_MS,
    now: () => {
      elapsed += PLANNER_JOB_TIMEOUT_MS;
      return elapsed;
    },
    onUpdate: ({ phase }) => phases.push(phase),
  });
  assert.equal(result.phase, 'failed');
  assert.equal(result.strategies.length, 0);
  assert.equal(result.issues[0]?.code, 'job-timeout');
  assert.deepEqual(phases, ['queued', 'failed']);
});

test('cria snapshot imutável de uma versão de plano', () => {
  const result = generateStrategies(input);
  assert.equal(result.phase, 'succeeded');
  const version = createPlannerPlanVersion(result, input.request, {
    id: 'plan-version-1',
    number: 1,
    createdAt: '2026-09-06T00:00:00.000Z',
  });

  assert.equal(version.number, 1);
  assert.equal(version.gameDataVersion, 'starter-0.1.0');
  assert.equal(version.priceSnapshotId, 'starter-manual-2026-09-06');
  assert.notEqual(version.result, result);
  assert.notEqual(version.result.strategies[0], result.strategies[0]);

  version.request.excludedMechanics.push('bench');
  assert.deepEqual(result.strategies.length, 3);
  assert.deepEqual(input.request.excludedMechanics, []);
});
