/* eslint-disable @typescript-eslint/no-floating-promises */

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ACCOUNT_DELETION_DELAY_MS,
  createAccountDeletionRecord,
  isAccountDeletionPayload,
  processAccountDeletionRecord,
} from './model/account-deletion.ts';

function track(calls: string[], value: string) {
  calls.push(value);
  return Promise.resolve();
}

test('valida confirmação explícita e cria prazo de 24 horas', () => {
  assert.equal(isAccountDeletionPayload({ confirmation: 'DELETE' }), true);
  assert.equal(isAccountDeletionPayload({ confirmation: 'delete' }), false);
  assert.equal(isAccountDeletionPayload(null), false);

  const now = new Date('2026-09-06T12:00:00.000Z');
  const record = createAccountDeletionRecord('uid-1', now);
  assert.equal(record.status, 'pending');
  assert.equal(
    Date.parse(record.scheduledFor) - Date.parse(record.requestedAt),
    ACCOUNT_DELETION_DELAY_MS,
  );
});

test('mantém solicitação pendente idempotente e processa a ordem de limpeza', async () => {
  const now = new Date('2026-09-07T12:00:00.000Z');
  const record = createAccountDeletionRecord('uid-1', new Date('2026-09-06T12:00:00.000Z'));
  const same = createAccountDeletionRecord('uid-1', now, record);
  assert.equal(same, record);

  const calls: string[] = [];
  const result = await processAccountDeletionRecord(
    record,
    {
      markProcessing: () => track(calls, 'processing'),
      deleteCrafts: () => track(calls, 'crafts'),
      deleteScreenshots: () => track(calls, 'screenshots'),
      deleteAuth: () => track(calls, 'auth'),
      markCompleted: () => track(calls, 'completed'),
      markFailed: () => track(calls, 'failed'),
    },
    now,
  );

  assert.equal(result, 'completed');
  assert.deepEqual(calls, ['processing', 'crafts', 'screenshots', 'auth', 'completed']);
});

test('não processa antes do prazo e registra falhas recuperáveis', async () => {
  const record = createAccountDeletionRecord('uid-1', new Date('2026-09-06T12:00:00.000Z'));
  const beforeDueCalls: string[] = [];
  const skipped = await processAccountDeletionRecord(
    record,
    {
      markProcessing: () => track(beforeDueCalls, 'processing'),
      deleteCrafts: () => track(beforeDueCalls, 'crafts'),
      deleteScreenshots: () => track(beforeDueCalls, 'screenshots'),
      deleteAuth: () => track(beforeDueCalls, 'auth'),
      markCompleted: () => track(beforeDueCalls, 'completed'),
      markFailed: () => track(beforeDueCalls, 'failed'),
    },
    new Date('2026-09-06T12:01:00.000Z'),
  );
  assert.equal(skipped, 'skipped');
  assert.deepEqual(beforeDueCalls, [] as string[]);

  const failureCalls: string[] = [];
  const failed = await processAccountDeletionRecord(
    record,
    {
      markProcessing: () => track(failureCalls, 'processing'),
      deleteCrafts: () => {
        failureCalls.push('crafts');
        return Promise.reject(new Error('Firestore indisponível'));
      },
      deleteScreenshots: () => track(failureCalls, 'screenshots'),
      deleteAuth: () => track(failureCalls, 'auth'),
      markCompleted: () => track(failureCalls, 'completed'),
      markFailed: (_record, _now, message) => track(failureCalls, `failed:${message}`),
    },
    new Date('2026-09-07T12:01:00.000Z'),
  );
  assert.equal(failed, 'failed');
  assert.deepEqual(failureCalls, ['processing', 'crafts', 'failed:Firestore indisponível']);
});
