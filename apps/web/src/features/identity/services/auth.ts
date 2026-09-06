import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  connectAuthEmulator,
  getAuth,
  GoogleAuthProvider,
  linkWithPopup,
  onAuthStateChanged,
  signInAnonymously,
  type Auth,
  type User,
} from 'firebase/auth';
import { env } from '@/shared/config';
import type { IdentityUser } from '../model/identity';

export interface AuthGateway {
  watch(listener: (user: IdentityUser | null) => void): () => void;
  ensureAnonymous(): Promise<void>;
  linkGoogle(): Promise<IdentityUser>;
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

  watch(listener: (user: IdentityUser | null) => void) {
    return onAuthStateChanged(this.auth, (user) => listener(user ? mapUser(user) : null));
  }

  async ensureAnonymous() {
    if (!this.auth.currentUser) await signInAnonymously(this.auth);
  }

  async linkGoogle() {
    const user = this.auth.currentUser;
    if (!user) throw new Error('A sessão ainda está inicializando. Tente novamente.');
    const result = user.isAnonymous
      ? await linkWithPopup(user, new GoogleAuthProvider())
      : { user };
    return mapUser(result.user);
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
