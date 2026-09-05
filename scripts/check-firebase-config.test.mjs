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
      functions: { source: 'functions', runtime: 'nodejs22' },
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

test('aceita emuladores locais, Node 22 e regras deny-all', () => {
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
    assert.match(errors, /handlers fictícios/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
