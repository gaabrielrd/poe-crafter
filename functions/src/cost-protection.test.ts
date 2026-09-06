/* eslint-disable @typescript-eslint/no-floating-promises */
import assert from 'node:assert/strict';
import test from 'node:test';
import {
  emptyOperationalUsage,
  parseCostGuardPayload,
  readCostProtectionConfig,
  reserveOperationalCost,
} from './model/cost-protection.ts';

const config = { monthlyBudgetUsd: 10, ocrCostUsd: 0.01, planningCostUsd: 0.1 };

test('bloqueia OCR ao se aproximar do orçamento antes de bloquear planejamento', () => {
  const usage = { ...emptyOperationalUsage('2026-09'), estimatedCostUsd: 7.99 };
  const ocr = reserveOperationalCost(usage, 'ocr', 'ocr-request-1', config);
  assert.equal(ocr.response.allowed, false);
  assert.equal(ocr.response.code, 'ocr-budget-near');

  const planning = reserveOperationalCost(usage, 'planning', 'plan-request-1', config);
  assert.equal(planning.response.allowed, true);
  assert.equal(planning.usage.counts.planning, 1);
});

test('mantém reserva idempotente e bloqueia planejamento no limite total', () => {
  const first = reserveOperationalCost(
    emptyOperationalUsage('2026-09'),
    'planning',
    'plan-request-1',
    config,
  );
  const repeated = reserveOperationalCost(first.usage, 'planning', 'plan-request-1', config);
  assert.equal(repeated.response.allowed, true);
  assert.deepEqual(repeated.usage, first.usage);

  const nearLimit = { ...first.usage, estimatedCostUsd: 9.95 };
  const blocked = reserveOperationalCost(nearLimit, 'planning', 'plan-request-2', config);
  assert.equal(blocked.response.allowed, false);
  assert.equal(blocked.response.code, 'budget-exceeded');
});

test('valida requestId e configura defaults sem aceitar valores inválidos', () => {
  assert.deepEqual(parseCostGuardPayload({ operation: 'planning', requestId: 'plan-123456' }), {
    operation: 'planning',
    requestId: 'plan-123456',
  });
  assert.equal(parseCostGuardPayload({ operation: 'ocr', requestId: 'short' }), null);
  assert.deepEqual(
    readCostProtectionConfig({
      POE_MONTHLY_BUDGET_USD: '-1',
      POE_OCR_COST_USD: '0.02',
      POE_PLANNING_COST_USD: 'invalid',
    }),
    { monthlyBudgetUsd: 10, ocrCostUsd: 0.02, planningCostUsd: 0.1 },
  );
});
