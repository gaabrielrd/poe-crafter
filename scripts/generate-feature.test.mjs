import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { generateFeature } from './generate-feature.mjs';

test('planeja e cria uma feature Tailwind no workspace web sem sobrescrever arquivos', () => {
  const root = mkdtempSync(join(tmpdir(), 'poe-feature-'));
  try {
    const planned = generateFeature(root, 'Relatórios Mensais', true);
    assert.equal(planned.length, 5);
    assert.equal(existsSync(join(root, 'apps/web/src/features/relatorios-mensais')), false);

    generateFeature(root, 'Relatórios Mensais');
    const component = join(
      root,
      'apps/web/src/features/relatorios-mensais/components/RelatoriosMensais.tsx',
    );
    assert.equal(existsSync(component), true);
    assert.match(readFileSync(component, 'utf8'), /font-display text-2xl text-foreground/);
    assert.equal(
      existsSync(
        join(
          root,
          'apps/web/src/features/relatorios-mensais/components/RelatoriosMensais.module.css',
        ),
      ),
      false,
    );
    assert.throws(() => generateFeature(root, 'Relatórios Mensais'), /já existe/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
