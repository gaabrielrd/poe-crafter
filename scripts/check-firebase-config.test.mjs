import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { checkFirebaseConfig } from './check-firebase-config.mjs';

function write(root, file, content) {
  const path = join(root, file);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

function project() {
  const root = mkdtempSync(join(tmpdir(), 'poe-firebase-'));
  write(
    root,
    'firebase.json',
    JSON.stringify({
      hosting: { public: 'apps/web/dist' },
      functions: { source: 'functions', runtime: 'nodejs24' },
      emulators: Object.fromEntries(
        ['auth', 'functions', 'firestore', 'hosting', 'storage'].map((name, index) => [
          name,
          { port: 5000 + index },
        ]),
      ),
    }),
  );
  const denyAll = 'allow read, write: if false;\n';
  write(root, 'firestore.rules', denyAll);
  write(root, 'storage.rules', denyAll);
  write(root, 'functions/src/index.ts', 'export {};\n');
  return root;
}

test('aceita emuladores locais, Node 24 e regras deny-all', () => {
  const root = project();
  try {
    assert.deepEqual(checkFirebaseConfig(root), []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('rejeita acesso permissivo, projeto fixado e handler prematuro', () => {
  const root = project();
  try {
    write(root, 'firestore.rules', 'allow read, write: if true;\n');
    write(root, '.firebaserc', JSON.stringify({ projects: { default: 'production-id' } }));
    write(
      root,
      'functions/src/index.ts',
      "import { onRequest } from 'firebase-functions/v2/https';\n",
    );
    const errors = checkFirebaseConfig(root).join('\n');
    assert.match(errors, /firestore\.rules.*negar/);
    assert.match(errors, /\.firebaserc/);
    assert.match(errors, /handler não previsto/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('aceita Storage privado por UID com limite de imagem', () => {
  const root = project();
  try {
    write(
      root,
      'storage.rules',
      `match /screenshots/{uid}/{fileName} {
        allow read, delete: if request.auth != null && request.auth.uid == uid;
        allow create, update: if request.auth.uid == uid && request.resource.size <= 8 * 1024 * 1024;
      }
      match /{path=**} { allow read, write: if false; }`,
    );
    assert.deepEqual(checkFirebaseConfig(root), []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('aceita Firestore privado por ownerUid com fallback deny-all', () => {
  const root = project();
  try {
    write(
      root,
      'firestore.rules',
      `match /crafts/{craftId} {
        allow read, delete: if resource.data.ownerUid == request.auth.uid;
        allow create: if request.resource.data.ownerUid == request.auth.uid
          && request.resource.data.keys().hasOnly(['ownerUid']);
        allow update: if resource.data.ownerUid == request.auth.uid
          && request.resource.data.ownerUid == resource.data.ownerUid
          && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['target']);
      }
      match /{document=**} { allow read, write: if false; }`,
    );
    assert.deepEqual(checkFirebaseConfig(root), []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
