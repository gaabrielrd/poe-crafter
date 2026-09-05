import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import {
  REQUIRED_COMPONENTS,
  REQUIRED_THEME_TOKENS,
  checkStyleguide,
} from './check-styleguide.mjs';

function write(root, file, content) {
  const path = join(root, file);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

function project() {
  const root = mkdtempSync(join(tmpdir(), 'poe-styleguide-'));
  const tokens = REQUIRED_THEME_TOKENS.map((token) => `  ${token}: initial;`).join('\n');
  write(
    root,
    'apps/web/src/styles/globals.css',
    `@import 'tailwindcss';\n:root {\n${tokens}\n}\n@theme inline {}\n`,
  );
  write(
    root,
    'apps/web/src/main.tsx',
    "import '@fontsource-variable/archivo';\nimport './styles/globals.css';\n",
  );
  write(root, 'apps/web/index.html', '<html lang="pt-BR" data-theme="poe-crafter"></html>\n');
  write(
    root,
    'apps/web/package.json',
    JSON.stringify({
      dependencies: { 'lucide-react': '^1.0.0' },
      devDependencies: { tailwindcss: '^4.0.0', '@tailwindcss/vite': '^4.0.0', shadcn: '^4.0.0' },
    }),
  );
  write(
    root,
    'apps/web/components.json',
    JSON.stringify({
      iconLibrary: 'lucide',
      tailwind: { baseColor: 'neutral' },
      aliases: { ui: '@/shared/ui' },
    }),
  );
  for (const component of REQUIRED_COMPONENTS) {
    write(root, `apps/web/src/shared/ui/${component}`, 'export {};\n');
  }
  return root;
}

test('aceita Tailwind e shadcn configurados no workspace web', () => {
  const root = project();
  try {
    assert.deepEqual(checkStyleguide(root), []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('rejeita CSS Modules e cor literal fora do tema', () => {
  const root = project();
  try {
    write(root, 'apps/web/src/app/App.module.css', '.app { color: #ff0000; }\n');
    const errors = checkStyleguide(root).join('\n');
    assert.match(errors, /CSS Modules foi substituído/);
    assert.match(errors, /cor literal fora do tema global/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('rejeita token, componente e configuração shadcn ausentes', () => {
  const root = project();
  try {
    write(root, 'apps/web/src/styles/globals.css', "@import 'tailwindcss';\n@theme inline {}\n");
    rmSync(join(root, 'apps/web/src/shared/ui/button.tsx'));
    write(root, 'apps/web/components.json', JSON.stringify({ iconLibrary: 'other' }));
    const errors = checkStyleguide(root).join('\n');
    assert.match(errors, /token obrigatório "--primary"/);
    assert.match(errors, /button\.tsx.*obrigatório ausente/);
    assert.match(errors, /iconLibrary deve ser "lucide"/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('rejeita o kit Vitru e bibliotecas de ícones concorrentes', () => {
  const root = project();
  try {
    write(
      root,
      'apps/web/package.json',
      JSON.stringify({
        dependencies: { '@vitru/styleguide': '^0.1.0', 'react-icons': '^5.0.0' },
        devDependencies: { tailwindcss: '^4.0.0', '@tailwindcss/vite': '^4.0.0', shadcn: '^4.0.0' },
      }),
    );
    write(root, 'apps/web/src/app/App.tsx', "import { FaHome } from 'react-icons/fa';\n");
    const errors = checkStyleguide(root).join('\n');
    assert.match(errors, /remova o sistema visual legado/);
    assert.match(errors, /react-icons.*concorre/);
    assert.match(errors, /importe ícones de "lucide-react"/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
