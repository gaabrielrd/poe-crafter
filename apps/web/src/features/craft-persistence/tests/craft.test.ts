import { describe, expect, it } from 'vitest';
import {
  CRAFT_SCHEMA_VERSION,
  createCraftInput,
  createFixtureCraftRepository,
  validateCraftRecord,
  type CraftRecord,
} from '@/features/craft-persistence';
import type { AuthGateway } from '@/features/identity';
import type { NormalizedItemTarget } from '@poe-crafter/shared-types';

const target: NormalizedItemTarget = {
  baseName: 'Divine Crown',
  itemLevel: 86,
  influences: [],
  crafted: false,
  prefixes: [],
  suffixes: [],
  implicits: [],
  explicits: ['+100 to maximum Life'],
  unparsedLines: [],
};

function auth(uid = 'uid-a'): AuthGateway {
  return {
    watch: () => () => undefined,
    ensureAnonymous: () => Promise.resolve(),
    linkGoogle: () => Promise.resolve({ uid, kind: 'google' as const }),
    reauthenticateGoogle: () => Promise.resolve(),
    requestAccountDeletion: () =>
      Promise.resolve({
        status: 'pending' as const,
        requestedAt: '2026-09-06T00:00:00.000Z',
        scheduledFor: '2026-09-07T00:00:00.000Z',
      }),
    getIdToken: () => Promise.resolve('token'),
    getCurrentUser: () => ({ uid, kind: 'anonymous' as const }),
  };
}

function input() {
  return createCraftInput(
    { item: target, classifications: { 'explicit-0': 'required' } },
    { id: 'standard', name: 'Standard', platform: 'pc' },
    false,
  );
}

describe('craft persistence contract', () => {
  it('validates the serializable record and rejects unknown schema versions', () => {
    const record: CraftRecord = {
      id: 'craft-1',
      ownerUid: 'uid-a',
      schemaVersion: CRAFT_SCHEMA_VERSION,
      title: 'Divine Crown',
      league: { id: 'standard', name: 'Standard', platform: 'pc' },
      manualPricing: false,
      status: 'confirmed',
      target: input().target,
      createdAt: '2026-09-06T00:00:00.000Z',
      updatedAt: '2026-09-06T00:00:00.000Z',
    };

    expect(validateCraftRecord(record)).toEqual(record);
    expect(() => validateCraftRecord({ ...record, schemaVersion: 2 })).toThrow(
      'schemaVersion desconhecida',
    );
    expect(() =>
      validateCraftRecord({
        ...record,
        target: { item: target, classifications: { bad: 'later' } },
      }),
    ).toThrow('alvo ou classificações inválidos');
  });

  it('creates, lists, updates and isolates fixture crafts by UID', async () => {
    const repository = createFixtureCraftRepository(auth());
    const created = await repository.create(input());

    expect(created.ownerUid).toBe('uid-a');
    expect(await repository.listRecent()).toEqual([created]);
    const updated = await repository.update(created.id, {
      ...input(),
      title: 'Hubris Circlet',
      manualPricing: true,
    });
    expect(updated.title).toBe('Hubris Circlet');
    expect(updated.manualPricing).toBe(true);
    expect(await repository.get(created.id)).toEqual(updated);

    const otherRepository = createFixtureCraftRepository(auth('uid-b'));
    expect(await otherRepository.get(created.id)).toBeNull();
    expect(await otherRepository.listRecent()).toEqual([]);
  });
});
