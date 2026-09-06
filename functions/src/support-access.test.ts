/* eslint-disable @typescript-eslint/no-floating-promises */

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createSupportAuditEvent,
  isSupportCraftId,
  normalizeSupportCraft,
  parseSupportAccessPayload,
} from './model/support-access.ts';

const craft = {
  ownerUid: 'owner-1',
  schemaVersion: 1,
  title: 'Divine Crown',
  league: { id: 'standard', name: 'Standard', platform: 'pc' },
  manualPricing: false,
  status: 'confirmed',
  target: { item: { baseName: 'Divine Crown' }, classifications: {} },
  createdAt: '2026-09-06T10:00:00.000Z',
  updatedAt: '2026-09-06T10:05:00.000Z',
};

test('aceita IDs de craft seguros e rejeita tentativa de caminho', () => {
  assert.equal(isSupportCraftId('craft_123'), true);
  assert.equal(isSupportCraftId('../craft'), false);
  assert.equal(isSupportCraftId(''), false);
});

test('valida payload de suporte e limita justificativa', () => {
  assert.deepEqual(
    parseSupportAccessPayload({ craftId: 'craft_123', reason: 'Reprodução de bug' }),
    {
      craftId: 'craft_123',
      reason: 'Reprodução de bug',
    },
  );
  assert.equal(parseSupportAccessPayload({ craftId: 'craft_123', reason: ' ' }), null);
  assert.equal(parseSupportAccessPayload({ craftId: 'craft_123', reason: 'x'.repeat(501) }), null);
  assert.equal(parseSupportAccessPayload({ craftId: '../craft', reason: 'bug' }), null);
});

test('normaliza craft para resposta sem copiar conteúdo para auditoria', () => {
  const normalized = normalizeSupportCraft('craft_123', craft);
  assert.equal(normalized?.id, 'craft_123');
  assert.equal(normalized?.ownerUid, 'owner-1');
  assert.equal(normalizeSupportCraft('craft_123', { ...craft, status: 'draft' }), null);

  const event = createSupportAuditEvent(
    'admin-1',
    'craft_123',
    'Reprodução de bug',
    new Date('2026-09-06T11:00:00.000Z'),
  );
  assert.deepEqual(event, {
    schemaVersion: 1,
    actorUid: 'admin-1',
    action: 'craft-support-access',
    craftId: 'craft_123',
    reason: 'Reprodução de bug',
    createdAt: '2026-09-06T11:00:00.000Z',
  });
  assert.equal('target' in event, false);
});
