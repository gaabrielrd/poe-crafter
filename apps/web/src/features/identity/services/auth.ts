import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  connectAuthEmulator,
  getAuth,
  GoogleAuthProvider,
  linkWithPopup,
  onAuthStateChanged,
  reauthenticateWithPopup,
  signInAnonymously,
  type Auth,
  type User,
} from 'firebase/auth';
import { env } from '@/shared/config';
import type { AccountDeletionReceipt, IdentityUser } from '../model/identity';

export interface AuthGateway {
  watch(listener: (user: IdentityUser | null) => void): () => void;
  ensureAnonymous(): Promise<void>;
  linkGoogle(): Promise<IdentityUser>;
  reauthenticateGoogle(): Promise<void>;
  requestAccountDeletion(): Promise<AccountDeletionReceipt>;
  getIdToken(): Promise<string>;
  getCurrentUser(): IdentityUser | null;
}

/* c8 ignore start -- caminhos reais do SDK são exercitados contra o Auth Emulator. */
function mapUser(user: User): IdentityUser {
  return {
    uid: user.uid,
    kind: user.isAnonymous ? 'anonymous' : 'google',
    email: user.email ?? undefined,
    displayName: user.displayName ?? undefined,
  };
}

function firebaseConfig() {
  const values = [
    env.firebaseApiKey,
    env.firebaseAuthDomain,
    env.firebaseProjectId,
    env.firebaseStorageBucket,
    env.firebaseAppId,
  ];
  return values.every(Boolean)
    ? {
        apiKey: env.firebaseApiKey!,
        authDomain: env.firebaseAuthDomain!,
        projectId: env.firebaseProjectId!,
        storageBucket: env.firebaseStorageBucket!,
        appId: env.firebaseAppId!,
      }
    : undefined;
}

export function getFirebaseApp(): FirebaseApp {
  const config = firebaseConfig();
  if (!config) {
    throw new Error(
      'Firebase Web não configurado. Defina VITE_FIREBASE_* para habilitar a sessão de identidade.',
    );
  }
  return getApps().length > 0 ? getApp() : initializeApp(config);
}

function createFirebaseAuth(): Auth {
  const app = getFirebaseApp();
  const auth = getAuth(app);
  if (env.firebaseAuthEmulator && !env.isProduction) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  }
  return auth;
}

class FirebaseAuthGateway implements AuthGateway {
  private readonly auth: Auth;

  constructor(auth: Auth) {
    this.auth = auth;
  }

  watch(listener: (user: IdentityUser | null) => void): () => void {
    const unsubscribe: () => void = onAuthStateChanged(this.auth, (user: User | null) =>
      listener(user ? mapUser(user) : null),
    );
    return unsubscribe;
  }

  async ensureAnonymous() {
    if (!this.auth.currentUser) await signInAnonymously(this.auth);
  }

  async linkGoogle() {
    const user = this.auth.currentUser;
    if (!user) throw new Error('A sessão ainda está inicializando. Tente novamente.');
    const linkedUser: User = user.isAnonymous
      ? (await linkWithPopup(user, new GoogleAuthProvider())).user
      : user;
    return mapUser(linkedUser);
  }

  async reauthenticateGoogle() {
    const user = this.auth.currentUser;
    if (!user || user.isAnonymous) {
      throw Object.assign(new Error('Vincule uma conta Google antes de solicitar a exclusão.'), {
        code: 'auth/google-required',
      });
    }
    await reauthenticateWithPopup(user, new GoogleAuthProvider());
  }

  async requestAccountDeletion() {
    const endpoint = env.apiUrl
      ? `${env.apiUrl.replace(/\/$/, '')}/account-deletion`
      : '/api/account-deletion';
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${await this.getIdToken()}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ confirmation: 'DELETE' }),
    });
    const payload: unknown = await response.json();
    if (!response.ok) {
      const message =
        typeof payload === 'object' && payload !== null && 'message' in payload
          ? String(payload.message)
          : `A solicitação de exclusão respondeu ${response.status}.`;
      throw new Error(message);
    }
    if (!isAccountDeletionReceipt(payload)) {
      throw new Error('A solicitação de exclusão retornou dados inválidos.');
    }
    return payload;
  }

  async getIdToken() {
    const user = this.auth.currentUser;
    if (!user) throw new Error('A sessão ainda está inicializando. Tente novamente.');
    return user.getIdToken();
  }

  getCurrentUser() {
    return this.auth.currentUser ? mapUser(this.auth.currentUser) : null;
  }
}
/* c8 ignore stop */

class FixtureAuthGateway implements AuthGateway {
  private user: IdentityUser = { uid: 'fixture-anonymous-uid', kind: 'anonymous' };
  private listener: ((user: IdentityUser | null) => void) | undefined;

  watch(listener: (user: IdentityUser | null) => void) {
    this.listener = listener;
    queueMicrotask(() => listener(this.user));
    return () => {
      this.listener = undefined;
    };
  }

  ensureAnonymous() {
    this.listener?.(this.user);
    return Promise.resolve();
  }

  linkGoogle() {
    this.user = {
      uid: this.user.uid,
      kind: 'google',
      email: 'fixture@example.com',
      displayName: 'Conta Google (fixture)',
    };
    this.listener?.(this.user);
    return Promise.resolve(this.user);
  }

  reauthenticateGoogle() {
    if (this.user.kind !== 'google') {
      return Promise.reject(
        Object.assign(new Error('Vincule uma conta Google antes de solicitar a exclusão.'), {
          code: 'auth/google-required',
        }),
      );
    }
    return Promise.resolve();
  }

  requestAccountDeletion() {
    if (this.user.kind !== 'google') {
      return Promise.reject(
        Object.assign(new Error('Vincule uma conta Google antes de solicitar a exclusão.'), {
          code: 'auth/google-required',
        }),
      );
    }
    const requestedAt = new Date().toISOString();
    return Promise.resolve({
      status: 'pending' as const,
      requestedAt,
      scheduledFor: new Date(Date.parse(requestedAt) + 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  getIdToken() {
    return Promise.resolve('fixture-token');
  }

  getCurrentUser() {
    return this.user;
  }
}

class MissingConfigurationAuthGateway implements AuthGateway {
  watch(listener: (user: IdentityUser | null) => void) {
    queueMicrotask(() => listener(null));
    return () => undefined;
  }

  ensureAnonymous() {
    return Promise.reject(
      new Error(
        'Firebase Web não configurado. Defina VITE_FIREBASE_* para habilitar a sessão de identidade.',
      ),
    );
  }

  linkGoogle() {
    return Promise.reject(new Error('Configure o Firebase antes de vincular o Google.'));
  }

  reauthenticateGoogle() {
    return Promise.reject(new Error('Configure o Firebase antes de reautenticar o Google.'));
  }

  requestAccountDeletion() {
    return Promise.reject(new Error('Configure o Firebase antes de solicitar a exclusão.'));
  }

  getIdToken() {
    return Promise.reject(new Error('Configure o Firebase antes de processar o screenshot.'));
  }

  getCurrentUser() {
    return null;
  }
}

let defaultGateway: AuthGateway | undefined;

export function createFixtureAuthGateway(): AuthGateway {
  return new FixtureAuthGateway();
}

export function createMissingConfigurationAuthGateway(): AuthGateway {
  return new MissingConfigurationAuthGateway();
}

export function getDefaultAuthGateway(): AuthGateway {
  if (env.authFixture) return createFixtureAuthGateway();
  if (!firebaseConfig()) return new MissingConfigurationAuthGateway();
  defaultGateway ??= new FirebaseAuthGateway(createFirebaseAuth());
  return defaultGateway;
}

function isAccountDeletionReceipt(value: unknown): value is AccountDeletionReceipt {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<AccountDeletionReceipt>;
  return (
    candidate.status === 'pending' &&
    typeof candidate.requestedAt === 'string' &&
    !Number.isNaN(Date.parse(candidate.requestedAt)) &&
    typeof candidate.scheduledFor === 'string' &&
    !Number.isNaN(Date.parse(candidate.scheduledFor))
  );
}
