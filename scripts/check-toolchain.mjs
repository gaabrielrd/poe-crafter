#!/usr/bin/env node

import { readFileSync, realpathSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const defaultRoot = resolve(scriptDir, '..');

export function expectedPnpmVersion(root = defaultRoot) {
  const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  const match = /^pnpm@(\d+\.\d+\.\d+)$/.exec(packageJson.packageManager ?? '');
  if (!match) throw new Error('packageManager deve usar o formato pnpm@x.y.z.');
  return match[1];
}

export function expectedNodeVersion(root = defaultRoot) {
  return readFileSync(join(root, '.nvmrc'), 'utf8').trim();
}

export function checkToolchain(
  root = defaultRoot,
  userAgent = process.env.npm_config_user_agent,
  nodeVersion = process.versions.node,
) {
  const expected = expectedPnpmVersion(root);
  const expectedNode = expectedNodeVersion(root);
  const actual = /^pnpm\/(\d+\.\d+\.\d+)/.exec(userAgent ?? '')?.[1];
  if (!actual) throw new Error('Execute esta verificação por `pnpm check:toolchain`.');
  if (actual !== expected) {
    throw new Error(`Versão do pnpm divergente: esperado ${expected}, encontrado ${actual}.`);
  }
  if (nodeVersion !== expectedNode) {
    throw new Error(
      `Versão do Node divergente: esperado ${expectedNode}, encontrado ${nodeVersion}.`,
    );
  }
  return actual;
}

function main() {
  const version = checkToolchain();
  console.log(`Toolchain OK: pnpm ${version}; Node ${process.versions.node}.`);
}

if (
  process.argv[1] &&
  realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url))
) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
