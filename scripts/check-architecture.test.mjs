import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { checkArchitecture } from './check-architecture.mjs';

function withProject(files, assertion) {
  const root = mkdtempSync(join(tmpdir(), 'poe-architecture-'));
  try {
    for (const [path, content] of Object.entries(files)) {
      const file = join(root, path);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, content);
    }
    assertion(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const web = (path) => `apps/web/src/${path}`;

test('aceita consumo pela interface pública da feature', () => {
  withProject(
    {
      [web('app/App.tsx')]: "import { Notes } from '@/features/notes';",
      [web('features/notes/index.ts')]: '',
    },
    (root) => assert.deepEqual(checkArchitecture(root), []),
  );
});

test('rejeita import interno entre features', () => {
  withProject(
    { [web('features/search/index.ts')]: "export { parse } from '@/features/notes/model/note';" },
    (root) => assert.equal(checkArchitecture(root).length, 1),
  );
});

test('rejeita dependência de domínio dentro de shared', () => {
  withProject(
    { [web('shared/lib/format.ts')]: "import type { Note } from '@/features/notes';" },
    (root) => assert.equal(checkArchitecture(root).length, 1),
  );
});

test('rejeita import dinâmico de arquivo interno de outra feature', () => {
  withProject(
    {
      [web('features/search/index.ts')]:
        "const notes = import('@/features/notes/services/noteStorage');",
    },
    (root) => assert.equal(checkArchitecture(root).length, 1),
  );
});

test('rejeita fetch fora de uma fronteira de serviço', () => {
  withProject(
    { [web('features/search/components/Search.tsx')]: "export const load = () => fetch('/api');" },
    (root) =>
      assert.match(checkArchitecture(root).join('\n'), /fetch.*services, adapters ou repositories/),
  );
});

test('rejeita localStorage fora de uma fronteira de persistência', () => {
  withProject(
    {
      [web('features/notes/components/Notes.tsx')]:
        "export const load = () => localStorage.getItem('x');",
    },
    (root) => assert.match(checkArchitecture(root).join('\n'), /localStorage.*services/),
  );
});

test('rejeita import.meta.env fora do módulo de configuração', () => {
  withProject(
    {
      [web('features/search/services/search.ts')]:
        'export const url = import.meta.env.VITE_API_URL;',
    },
    (root) => assert.match(checkArchitecture(root).join('\n'), /import\.meta\.env.*shared\/config/),
  );
});

test('aceita APIs web nos limites permitidos', () => {
  withProject(
    {
      [web('features/search/services/search.ts')]: "export const load = () => fetch('/api');",
      [web('features/notes/repositories/notes.ts')]:
        "export const load = () => window.localStorage.getItem('notes');",
      [web('shared/config/env.ts')]: 'export const raw = import.meta.env;',
    },
    (root) => assert.deepEqual(checkArchitecture(root), []),
  );
});

test('ignora comentários, strings e arquivos de teste', () => {
  withProject(
    {
      [web('features/search/components/Search.tsx')]:
        "// fetch('/api')\nexport const text = 'localStorage import.meta.env';",
      [web('features/search/tests/Search.test.ts')]:
        'export const load = () => fetch(String(import.meta.env.VITE_API_URL)); localStorage.clear();',
    },
    (root) => assert.deepEqual(checkArchitecture(root), []),
  );
});

test('aceita dependências previstas entre workspaces', () => {
  withProject(
    {
      'functions/src/index.ts': "import type {} from '@poe-crafter/poe-data';",
      'packages/poe-data/src/index.ts': "import type {} from '@poe-crafter/shared-types';",
      [web('main.tsx')]: "import type {} from '@poe-crafter/shared-types';",
    },
    (root) => assert.deepEqual(checkArchitecture(root), []),
  );
});

test('rejeita dependência invertida e import de internals', () => {
  withProject(
    {
      'packages/shared-types/src/index.ts': "import type {} from '@poe-crafter/poe-data';",
      [web('main.tsx')]: "import type {} from '@poe-crafter/shared-types/internal';",
    },
    (root) => {
      const errors = checkArchitecture(root).join('\n');
      assert.match(errors, /shared-types.*não pode importar.*poe-data/);
      assert.match(errors, /shared-types.*apenas por sua API pública/);
    },
  );
});
