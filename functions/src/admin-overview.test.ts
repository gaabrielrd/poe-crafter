/* eslint-disable @typescript-eslint/no-floating-promises */

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isAuthorizedAdmin,
  normalizeAdminOverview,
  parseAdminUids,
} from './model/admin-operations.ts';

test('autoriza somente UID Google listado na configuração privada', () => {
  const admins = parseAdminUids(' uid-admin ,uid-second,, ');
  assert.equal(isAuthorizedAdmin('uid-admin', 'google.com', admins), true);
  assert.equal(isAuthorizedAdmin('uid-admin', 'anonymous', admins), false);
  assert.equal(isAuthorizedAdmin('uid-other', 'google.com', admins), false);
});

test('normaliza diagnóstico incompleto sem inventar estado operacional', () => {
  const overview = normalizeAdminOverview(
    {
      activeLeague: { id: 'standard', name: 'Standard', platform: 'pc' },
      dataset: { version: 'starter-1', status: 'active', updatedAt: '2026-09-06T10:00:00.000Z' },
      jobs: [
        { id: 'job-queued', status: 'queued' },
        {
          id: 'job-failed',
          type: 'league-refresh',
          status: 'failed',
          updatedAt: '2026-09-06T11:00:00.000Z',
          errorMessage: 'Provider indisponível',
        },
        { id: 'invalid', status: 'failed', errorMessage: 'sem data' },
      ],
    },
    new Date('2026-09-06T12:00:00.000Z'),
  );

  assert.equal(overview.schemaVersion, 1);
  assert.equal(overview.generatedAt, '2026-09-06T12:00:00.000Z');
  assert.equal(overview.activeLeague?.name, 'Standard');
  assert.equal(overview.priceSnapshot, null);
  assert.deepEqual(overview.queue, { queued: 1, running: 0, failed: 2 });
  assert.deepEqual(
    overview.recentFailures.map((failure) => failure.id),
    ['job-failed'],
  );
});

test('limita falhas recentes e ordena pela atualização mais recente', () => {
  const jobs = Array.from({ length: 12 }, (_, index) => ({
    id: `job-${index}`,
    type: 'planning',
    status: 'failed' as const,
    updatedAt: new Date(Date.UTC(2026, 8, 6, index)).toISOString(),
    errorMessage: `Falha ${index}`,
  }));
  const overview = normalizeAdminOverview({ jobs });
  assert.equal(overview.recentFailures.length, 10);
  assert.equal(overview.recentFailures[0]?.id, 'job-11');
  assert.equal(overview.recentFailures.at(-1)?.id, 'job-2');
});
