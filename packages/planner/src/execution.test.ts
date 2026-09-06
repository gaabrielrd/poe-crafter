/* eslint-disable @typescript-eslint/no-floating-promises */

import assert from 'node:assert/strict';
import test from 'node:test';
import { appendExecutionEvent, createExecutionState, summarizeExecution } from './execution.ts';
import type { PlannerStrategy } from './index.ts';

const strategy: Pick<PlannerStrategy, 'id' | 'steps'> = {
  id: 'strategy-test',
  steps: [
    {
      id: 'step-1',
      operationId: 'operation-1',
      label: 'Passo 1',
      mechanic: 'bench',
      resource: 'Bench',
      costChaos: 1,
      effectiveCostChaos: 1,
      successProbability: 1,
      expectedAttempts: 1,
      validation: 'accepted',
      retry: 'retry',
      restart: 'restart',
      expectedState: 'estado 1',
      skippable: false,
    },
    {
      id: 'step-2',
      operationId: 'operation-2',
      label: 'Passo 2',
      mechanic: 'bench',
      resource: 'Bench',
      costChaos: 1,
      effectiveCostChaos: 1,
      successProbability: 1,
      expectedAttempts: 1,
      validation: 'accepted',
      retry: 'retry',
      restart: 'restart',
      expectedState: 'estado 2',
      skippable: false,
    },
  ],
};

const summaryStrategy: PlannerStrategy = {
  ...strategy,
  recipeId: 'recipe-test',
  label: 'Estratégia de teste',
  objective: 'recommended',
  gameDataVersion: 'game-test',
  priceSnapshotId: 'price-test',
  expectedCostChaos: 4,
  p90CostChaos: 5,
  expectedAttempts: 2,
  successProbability: 1,
  riskScore: 0,
  signature: 'operation-1>operation-2',
  target: { baseName: 'Base', itemLevel: 84, influences: [] },
};

test('preserva eventos e avança sucesso, retry e restart', () => {
  const initial = createExecutionState(strategy, 'plan-version-1');
  assert.equal(initial.planVersionId, 'plan-version-1');
  const retry = appendExecutionEvent(initial, strategy, {
    outcome: 'retry',
    resources: [{ resource: 'Orb', chaos: 2 }],
    recordedAt: '2026-09-06T00:00:00.000Z',
  });
  assert.ok('state' in retry);
  assert.equal(retry.state.currentStepIndex, 0);
  assert.equal(retry.state.totalCostChaos, 2);
  const restart = appendExecutionEvent(retry.state, strategy, {
    outcome: 'restart',
    resources: [{ resource: 'Orb', chaos: 3 }],
    recordedAt: '2026-09-06T00:01:00.000Z',
  });
  assert.ok('state' in restart);
  assert.equal(restart.state.currentStepIndex, 0);
  assert.equal(restart.state.events[0]?.outcome, 'retry');
  assert.equal(restart.state.events[1]?.sequence, 2);
  const success = appendExecutionEvent(restart.state, strategy, {
    outcome: 'success',
    resources: [],
    recordedAt: '2026-09-06T00:02:00.000Z',
  });
  assert.ok('state' in success);
  assert.equal(success.state.currentStepIndex, 1);
  assert.equal(success.state.status, 'active');
});

test('rejeita recurso inválido, skip proibido e novos eventos após conclusão', () => {
  const initial = createExecutionState(strategy);
  const invalid = appendExecutionEvent(initial, strategy, {
    outcome: 'success',
    resources: [{ resource: '', chaos: -1 }],
    recordedAt: '2026-09-06T00:00:00.000Z',
  });
  assert.ok('issues' in invalid);
  assert.equal(invalid.issues.length, 2);
  const skipped = appendExecutionEvent(initial, strategy, {
    outcome: 'skipped',
    resources: [],
    recordedAt: '2026-09-06T00:00:00.000Z',
  });
  assert.ok('issues' in skipped);
  assert.equal(skipped.issues[0]?.code, 'outcome_not_allowed');
  const firstSuccess = appendExecutionEvent(initial, strategy, {
    outcome: 'success',
    resources: [],
    recordedAt: '2026-09-06T00:00:00.000Z',
  });
  assert.ok('state' in firstSuccess);
  const completed = appendExecutionEvent(firstSuccess.state, strategy, {
    outcome: 'success',
    resources: [],
    recordedAt: '2026-09-06T00:01:00.000Z',
  });
  assert.ok('state' in completed);
  assert.equal(completed.state.status, 'completed');
  const after = appendExecutionEvent(completed.state, strategy, {
    outcome: 'retry',
    resources: [],
    recordedAt: '2026-09-06T00:02:00.000Z',
  });
  assert.ok('issues' in after);
  assert.equal(after.issues[0]?.code, 'execution_complete');
});

test('resume custo, tentativas e caminho sem converter preço indisponível em zero', () => {
  let state = createExecutionState(summaryStrategy);
  const retry = appendExecutionEvent(state, summaryStrategy, {
    outcome: 'retry',
    resources: [{ resource: 'Unknown currency', chaos: null }],
    recordedAt: '2026-09-06T00:00:00.000Z',
  });
  assert.ok('state' in retry);
  state = retry.state;
  const firstSuccess = appendExecutionEvent(state, summaryStrategy, {
    outcome: 'success',
    resources: [{ resource: 'Orb', chaos: 2 }],
    recordedAt: '2026-09-06T00:01:00.000Z',
  });
  assert.ok('state' in firstSuccess);
  state = firstSuccess.state;
  const finalSuccess = appendExecutionEvent(state, summaryStrategy, {
    outcome: 'success',
    resources: [],
    recordedAt: '2026-09-06T00:02:00.000Z',
  });
  assert.ok('state' in finalSuccess);
  state = finalSuccess.state;

  const summary = summarizeExecution(state, summaryStrategy);
  assert.ok(summary);
  assert.equal(summary.planVersionId, summaryStrategy.id);
  assert.equal(summary.realCostChaos, null);
  assert.equal(summary.knownRealCostChaos, 2);
  assert.equal(summary.differenceChaos, null);
  assert.equal(summary.attemptsByStep[0]?.attempts, 2);
  assert.equal(summary.attemptsByStep[1]?.attempts, 1);
  assert.equal(summary.path.length, 3);
  assert.equal(summarizeExecution(createExecutionState(summaryStrategy), summaryStrategy), null);
});
