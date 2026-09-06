/* eslint-disable @typescript-eslint/no-floating-promises */
import assert from 'node:assert/strict';
import test from 'node:test';
import { STARTER_PLANNER_DATASET } from '@poe-crafter/planner';
import {
  activateDataset,
  canActivateDataset,
  createDatasetAuditEvent,
  createImportedDatasetRecord,
  isDatasetVersion,
  parseDatasetActionPayload,
  retireDataset,
  validateDatasetRecord,
} from './model/dataset-lifecycle.ts';

test('aceita identificadores de versão seguros e rejeita traversal', () => {
  assert.equal(isDatasetVersion('poe1-2026.09'), true);
  assert.equal(isDatasetVersion('../activeDataset'), false);
  assert.equal(isDatasetVersion(''), false);
  assert.equal(isDatasetVersion('a'.repeat(65)), false);
});

test('valida payloads das ações sem aceitar dataset ausente no import', () => {
  assert.equal(parseDatasetActionPayload({ action: 'import', version: 'v1' }), null);
  assert.deepEqual(parseDatasetActionPayload({ action: 'validate', version: 'v1' }), {
    action: 'validate',
    version: 'v1',
    dataset: undefined,
  });
  assert.deepEqual(
    parseDatasetActionPayload({
      action: 'import',
      version: 'v1',
      dataset: STARTER_PLANNER_DATASET,
    }),
    { action: 'import', version: 'v1', dataset: STARTER_PLANNER_DATASET },
  );
});

test('mantém falha de validação no histórico e não permite ativação', () => {
  const now = new Date('2026-09-06T10:00:00.000Z');
  const invalid = createImportedDatasetRecord('broken', { schemaVersion: 2 }, now);
  const result = validateDatasetRecord(invalid, now);
  assert.equal(result.record.status, 'failed');
  assert.ok(result.issues.length > 0);
  assert.equal(canActivateDataset(result.record), false);
});

test('transiciona versão validada e aposenta a anterior', () => {
  const now = new Date('2026-09-06T10:00:00.000Z');
  const imported = createImportedDatasetRecord('v1', STARTER_PLANNER_DATASET, now);
  const validated = validateDatasetRecord(imported, now).record;
  const active = activateDataset(validated, 'publish', now);
  const retired = retireDataset(active, new Date('2026-09-06T11:00:00.000Z'));
  assert.equal(active.status, 'active');
  assert.equal(retired.status, 'retired');
  assert.equal(retired.retiredAt, '2026-09-06T11:00:00.000Z');
});

test('auditoria contém somente metadados da ação', () => {
  const event = createDatasetAuditEvent(
    'admin-1',
    'validate',
    'v1',
    'rejected',
    new Date('2026-09-06T10:00:00.000Z'),
    2,
  );
  assert.deepEqual(event, {
    schemaVersion: 1,
    actorUid: 'admin-1',
    action: 'validate',
    version: 'v1',
    result: 'rejected',
    createdAt: '2026-09-06T10:00:00.000Z',
    issueCount: 2,
  });
  assert.equal('dataset' in event, false);
});
