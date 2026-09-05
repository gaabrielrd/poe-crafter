#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const defaultRoot = resolve(scriptDir, '..');

export function checkFirebaseConfig(root = defaultRoot) {
  const errors = [];
  const firebasePath = join(root, 'firebase.json');
  if (!existsSync(firebasePath)) return ['firebase.json: configuração ausente.'];

  let config;
  try {
    config = JSON.parse(readFileSync(firebasePath, 'utf8'));
  } catch {
    return ['firebase.json: JSON inválido.'];
  }

  if (config.hosting?.public !== 'apps/web/dist') {
    errors.push('firebase.json: Hosting deve publicar "apps/web/dist".');
  }
  if (config.functions?.source !== 'functions' || config.functions?.runtime !== 'nodejs22') {
    errors.push('firebase.json: Functions deve usar source "functions" e runtime "nodejs22".');
  }
  for (const emulator of ['auth', 'functions', 'firestore', 'hosting', 'storage']) {
    if (!config.emulators?.[emulator]?.port) {
      errors.push(`firebase.json: emulador "${emulator}" sem porta explícita.`);
    }
  }

  for (const rulesFile of ['firestore.rules', 'storage.rules']) {
    const path = join(root, rulesFile);
    if (!existsSync(path)) {
      errors.push(`${rulesFile}: arquivo ausente.`);
      continue;
    }
    const rules = readFileSync(path, 'utf8');
    if (!/allow\s+read,\s*write:\s*if\s+false\s*;/.test(rules)) {
      errors.push(`${rulesFile}: o marco estrutural deve negar leitura e escrita por padrão.`);
    }
  }

  if (existsSync(join(root, '.firebaserc'))) {
    errors.push('.firebaserc: aliases pessoais e project IDs não devem ser versionados.');
  }

  const functionsIndex = join(root, 'functions', 'src', 'index.ts');
  if (!existsSync(functionsIndex)) {
    errors.push('functions/src/index.ts: limite do backend ausente.');
  } else if (
    /firebase-functions|onRequest|onCall|onTaskDispatched/.test(
      readFileSync(functionsIndex, 'utf8'),
    )
  ) {
    errors.push('functions/src/index.ts: não publique handlers fictícios no marco estrutural.');
  }
  return errors;
}

function main() {
  const errors = checkFirebaseConfig();
  if (errors.length === 0) {
    console.log('Configuração Firebase estrutural OK: emuladores e regras deny-all.');
    return;
  }
  console.error('Configuração Firebase FALHOU:\n');
  for (const error of errors) console.error(`  - ${error}`);
  process.exitCode = 1;
}

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) main();
