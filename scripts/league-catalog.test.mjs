import test from 'node:test';
import assert from 'node:assert/strict';
import { loadLeagueCatalog } from '../functions/src/api/league-catalog.ts';
import { normalizeLeagueCatalog } from '../packages/pricing/src/index.ts';

test('normaliza somente ligas PC ativas e remove duplicatas', () => {
  const catalog = normalizeLeagueCatalog(
    [
      { id: 'settlers', name: ' Settlers ', platform: 'pc', active: true },
      { id: 'settlers', name: 'Duplicada', platform: 'pc' },
      { id: 'console', name: 'Console', platform: 'console' },
      { id: 'ended', name: 'Encerrada', platform: 'pc', end: '2020-01-01T00:00:00Z' },
      { id: 'inactive', name: 'Inativa', platform: 'pc', active: false },
    ],
    '2026-09-05T12:00:00.000Z',
  );

  assert.deepEqual(catalog, {
    fetchedAt: '2026-09-05T12:00:00.000Z',
    leagues: [{ id: 'settlers', name: 'Settlers', platform: 'pc' }],
  });
});

test('carrega o contrato do endpoint e rejeita resposta HTTP inválida', async () => {
  const fetchImpl = async () =>
    new Response(JSON.stringify([{ id: 'standard', name: 'Standard', platform: 'pc' }]), {
      headers: { 'content-type': 'application/json' },
    });
  const catalog = await loadLeagueCatalog({ fetchImpl, now: () => '2026-09-05T12:00:00.000Z' });
  assert.deepEqual(catalog, {
    fetchedAt: '2026-09-05T12:00:00.000Z',
    leagues: [{ id: 'standard', name: 'Standard', platform: 'pc' }],
  });

  await assert.rejects(
    () =>
      loadLeagueCatalog({
        fetchImpl: async () => new Response('unavailable', { status: 503 }),
      }),
    /503/,
  );
});
