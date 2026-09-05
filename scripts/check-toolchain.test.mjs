import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { checkToolchain, expectedNodeVersion, expectedPnpmVersion } from './check-toolchain.mjs';

function project(packageManager = 'pnpm@11.19.0') {
  const root = mkdtempSync(join(tmpdir(), 'poe-toolchain-'));
  writeFileSync(join(root, 'package.json'), JSON.stringify({ packageManager }));
  writeFileSync(join(root, '.nvmrc'), '24.14.1\n');
  return root;
}

test('aceita a versão exata declarada em packageManager', () => {
  const root = project();
  try {
    assert.equal(expectedPnpmVersion(root), '11.19.0');
    assert.equal(expectedNodeVersion(root), '24.14.1');
    assert.equal(
      checkToolchain(root, 'pnpm/11.19.0 npm/? node/v24.14.1 win32 x64', '24.14.1'),
      '11.19.0',
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('rejeita versão diferente da declarada', () => {
  const root = project();
  try {
    assert.throws(
      () => checkToolchain(root, 'pnpm/12.0.0 npm/? node/v24.14.1 linux x64', '24.14.1'),
      /esperado 11\.19\.0, encontrado 12\.0\.0/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('rejeita packageManager sem versão exata do pnpm', () => {
  const root = project('pnpm@latest');
  try {
    assert.throws(() => expectedPnpmVersion(root), /pnpm@x\.y\.z/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('rejeita execução por outro gerenciador', () => {
  const root = project();
  try {
    assert.throws(
      () => checkToolchain(root, 'npm/10.6.0 node/v24.14.1', '24.14.1'),
      /pnpm check:toolchain/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('rejeita versão do Node diferente da .nvmrc', () => {
  const root = project();
  try {
    assert.throws(
      () => checkToolchain(root, 'pnpm/11.19.0 npm/? node/v22.22.2', '22.22.2'),
      /esperado 24\.14\.1, encontrado 22\.22\.2/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
