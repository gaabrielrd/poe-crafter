#!/usr/bin/env node

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

function slugify(value) {
  const slug = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!slug) throw new Error('Informe um nome de feature válido.');
  return slug;
}

function pascalCase(value) {
  return value
    .split('-')
    .map((part) => `${part[0]?.toUpperCase() ?? ''}${part.slice(1)}`)
    .join('');
}

export function generateFeature(root, rawName, dryRun = false) {
  const name = slugify(rawName);
  const component = pascalCase(name);
  const sourceRoot = join(root, 'apps', 'web', 'src');
  const featureRoot = join(sourceRoot, 'features', name);
  if (existsSync(featureRoot)) throw new Error(`A feature "${name}" já existe.`);
  const files = {
    'index.ts': `export { ${component} } from './components/${component}';\n`,
    [`components/${component}.tsx`]: `export function ${component}() {\n  return (\n    <section className="space-y-4">\n      <h2 className="font-display text-2xl text-foreground">${component}</h2>\n    </section>\n  );\n}\n`,
    'model/index.ts': `export type ${component}State = Readonly<Record<string, never>>;\n`,
    'services/index.ts': `// Adicione aqui integrações externas e persistência da feature.\nexport {};\n`,
    [`tests/${component}.test.tsx`]: `import { render, screen } from '@/test/render';\nimport { ${component} } from '../components/${component}';\n\ntest('renderiza a feature ${name}', () => {\n  render(<${component} />);\n  expect(screen.getByRole('heading', { name: '${component}' })).toBeInTheDocument();\n});\n`,
  };
  const planned = Object.keys(files).map((path) =>
    join('apps', 'web', 'src', 'features', name, path),
  );
  if (dryRun) return planned;
  for (const [relative, content] of Object.entries(files)) {
    const file = join(featureRoot, relative);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, content);
  }
  return planned;
}

function main() {
  const { values } = parseArgs({
    options: {
      name: { type: 'string' },
      root: { type: 'string' },
      'dry-run': { type: 'boolean' },
    },
  });
  if (!values.name) throw new Error('Use --name="minha-feature".');
  const root = resolve(values.root || join(import.meta.dirname, '..'));
  const files = generateFeature(root, values.name, values['dry-run'] || false);
  console.log(`${values['dry-run'] ? 'Arquivos planejados' : 'Feature criada'}:`);
  for (const file of files) console.log(`  - ${file}`);
}

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
