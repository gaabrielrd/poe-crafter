import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { smokeBuild } from './smoke-build.mjs';

test('serve o index e os assets produzidos pelo build', async () => {
  const root = mkdtempSync(join(tmpdir(), 'web-smoke-'));
  try {
    mkdirSync(join(root, 'apps', 'web', 'dist', 'assets'), { recursive: true });
    writeFileSync(
      join(root, 'apps', 'web', 'dist', 'index.html'),
      '<script src="/assets/app.js"></script>',
    );
    writeFileSync(join(root, 'apps', 'web', 'dist', 'assets', 'app.js'), 'console.log("ok")');
    await smokeBuild(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('falha quando um asset referenciado está ausente', async () => {
  const root = mkdtempSync(join(tmpdir(), 'web-smoke-'));
  try {
    mkdirSync(join(root, 'apps', 'web', 'dist'), { recursive: true });
    writeFileSync(
      join(root, 'apps', 'web', 'dist', 'index.html'),
      '<script src="/assets/missing.js"></script>',
    );
    await assert.rejects(() => smokeBuild(root), /não existe/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
