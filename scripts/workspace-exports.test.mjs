import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';

const packagesRoot = resolve(import.meta.dirname, '../packages');

for (const directory of readdirSync(packagesRoot)) {
  const root = resolve(packagesRoot, directory);
  const manifest = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
  test(`${manifest.name}: exports públicos compilados são consumíveis`, async () => {
    const entry = manifest.exports['.'];
    assert.ok(readFileSync(resolve(root, entry.types), 'utf8').trim());
    await import(pathToFileURL(resolve(root, entry.import)).href);
  });
}
