/* c8 ignore file -- Firebase SDK adapter is validated by the Firestore Emulator. */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  type DocumentData,
  type Firestore,
} from 'firebase/firestore';
import { env } from '@/shared/config';
import { getDefaultAuthGateway, getFirebaseApp, type AuthGateway } from '@/features/identity';
import {
  CRAFT_SCHEMA_VERSION,
  validateCraftRecord,
  type CraftInput,
  type CraftRecord,
} from '../model/craft';

export interface CraftRepository {
  create(input: CraftInput): Promise<CraftRecord>;
  get(id: string): Promise<CraftRecord | null>;
  listRecent(): Promise<CraftRecord[]>;
  update(id: string, input: CraftInput): Promise<CraftRecord>;
}

function currentUserUid(auth: AuthGateway): string {
  const user = auth.getCurrentUser();
  if (!user) throw new Error('A sessão ainda não está pronta para salvar o craft.');
  return user.uid;
}

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string' && !Number.isNaN(Date.parse(value))) return value;
  throw new Error('O Firestore retornou um timestamp inválido.');
}

function fromDocument(id: string, data: DocumentData): CraftRecord {
  const stored = data as Record<string, unknown>;
  return validateCraftRecord({
    id,
    ownerUid: stored.ownerUid,
    schemaVersion: stored.schemaVersion,
    title: stored.title,
    league: stored.league ?? null,
    manualPricing: stored.manualPricing,
    status: stored.status,
    target: stored.target,
    createdAt: toIso(stored.createdAt),
    updatedAt: toIso(stored.updatedAt),
  });
}

function storedFields(
  uid: string,
  input: CraftInput,
  timestamps: { createdAt: unknown; updatedAt: unknown },
) {
  return {
    ownerUid: uid,
    schemaVersion: CRAFT_SCHEMA_VERSION,
    title: input.title ?? input.target.item.baseName,
    league: input.league,
    manualPricing: input.manualPricing,
    status: 'confirmed' as const,
    target: input.target,
    ...timestamps,
  };
}

class FirebaseCraftRepository implements CraftRepository {
  private readonly db: Firestore;
  private readonly auth: AuthGateway;

  constructor(db: Firestore, auth: AuthGateway) {
    this.db = db;
    this.auth = auth;
  }

  async create(input: CraftInput) {
    const uid = currentUserUid(this.auth);
    const reference = doc(collection(this.db, 'crafts'));
    const now = new Date().toISOString();
    await setDoc(
      reference,
      storedFields(uid, input, { createdAt: serverTimestamp(), updatedAt: serverTimestamp() }),
    );
    return validateCraftRecord({
      id: reference.id,
      ownerUid: uid,
      schemaVersion: CRAFT_SCHEMA_VERSION,
      title: input.title ?? input.target.item.baseName,
      league: input.league,
      manualPricing: input.manualPricing,
      status: 'confirmed',
      target: input.target,
      createdAt: now,
      updatedAt: now,
    });
  }

  async get(id: string) {
    const uid = currentUserUid(this.auth);
    const snapshot = await getDoc(doc(this.db, 'crafts', id));
    if (!snapshot.exists() || snapshot.data().ownerUid !== uid) return null;
    return fromDocument(snapshot.id, snapshot.data());
  }

  async listRecent() {
    const uid = currentUserUid(this.auth);
    const snapshot = await getDocs(
      query(
        collection(this.db, 'crafts'),
        where('ownerUid', '==', uid),
        orderBy('updatedAt', 'desc'),
        limit(50),
      ),
    );
    return snapshot.docs.map((item) => fromDocument(item.id, item.data()));
  }

  async update(id: string, input: CraftInput) {
    const uid = currentUserUid(this.auth);
    const reference = doc(this.db, 'crafts', id);
    const existing = await getDoc(reference);
    if (!existing.exists() || existing.data().ownerUid !== uid) {
      throw new Error('Craft não encontrado ou sem permissão para alteração.');
    }
    const createdAt = toIso(existing.data().createdAt);
    const updatedAt = new Date().toISOString();
    await updateDoc(
      reference,
      storedFields(uid, input, {
        createdAt: existing.data().createdAt,
        updatedAt: serverTimestamp(),
      }),
    );
    return validateCraftRecord({
      id,
      ownerUid: uid,
      schemaVersion: CRAFT_SCHEMA_VERSION,
      title: input.title ?? input.target.item.baseName,
      league: input.league,
      manualPricing: input.manualPricing,
      status: 'confirmed',
      target: input.target,
      createdAt,
      updatedAt,
    });
  }
}

class FixtureCraftRepository implements CraftRepository {
  private readonly records = new Map<string, CraftRecord>();
  private nextId = 1;
  private readonly auth: AuthGateway;

  constructor(auth: AuthGateway) {
    this.auth = auth;
  }

  private uid() {
    return currentUserUid(this.auth);
  }

  create(input: CraftInput) {
    const now = new Date().toISOString();
    const record = validateCraftRecord({
      id: `fixture-craft-${this.nextId++}`,
      ownerUid: this.uid(),
      schemaVersion: CRAFT_SCHEMA_VERSION,
      title: input.title ?? input.target.item.baseName,
      league: input.league,
      manualPricing: input.manualPricing,
      status: 'confirmed',
      target: input.target,
      createdAt: now,
      updatedAt: now,
    });
    this.records.set(record.id, record);
    return Promise.resolve(record);
  }

  get(id: string) {
    const record = this.records.get(id);
    return Promise.resolve(record?.ownerUid === this.uid() ? record : null);
  }

  listRecent() {
    return Promise.resolve(
      [...this.records.values()]
        .filter((record) => record.ownerUid === this.uid())
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    );
  }

  async update(id: string, input: CraftInput) {
    const existing = await this.get(id);
    if (!existing) throw new Error('Craft não encontrado ou sem permissão para alteração.');
    const record = validateCraftRecord({
      ...existing,
      title: input.title ?? input.target.item.baseName,
      league: input.league,
      manualPricing: input.manualPricing,
      target: input.target,
      updatedAt: new Date().toISOString(),
    });
    this.records.set(id, record);
    return record;
  }
}

export function createFirebaseCraftRepository(
  auth: AuthGateway = getDefaultAuthGateway(),
): CraftRepository {
  return new FirebaseCraftRepository(getFirestore(getFirebaseApp()), auth);
}

export function createFixtureCraftRepository(
  auth: AuthGateway = getDefaultAuthGateway(),
): CraftRepository {
  return new FixtureCraftRepository(auth);
}

let defaultRepository: CraftRepository | undefined;

export function getDefaultCraftRepository(): CraftRepository | undefined {
  if (defaultRepository) return defaultRepository;
  if (env.authFixture) {
    defaultRepository = createFixtureCraftRepository();
    return defaultRepository;
  }
  try {
    defaultRepository = createFirebaseCraftRepository();
    return defaultRepository;
  } catch {
    return undefined;
  }
}
