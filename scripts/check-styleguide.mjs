#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const defaultRoot = resolve(scriptDir, '..');
const WEB_ROOT = join('apps', 'web');
const GLOBALS_FILE = join(WEB_ROOT, 'src', 'styles', 'globals.css');
export const ICON_LIBRARY = 'lucide-react';
export const REQUIRED_THEME_TOKENS = [
  '--background',
  '--foreground',
  '--card',
  '--card-foreground',
  '--primary',
  '--primary-foreground',
  '--muted',
  '--muted-foreground',
  '--destructive',
  '--success',
  '--border',
  '--ring',
  '--font-display',
  '--font-sans',
  '--font-mono',
];
export const REQUIRED_COMPONENTS = ['alert.tsx', 'badge.tsx', 'button.tsx', 'button-variants.ts'];
const FORBIDDEN_ICON_PACKAGES = [
  'react-icons',
  '@heroicons/react',
  '@mui/icons-material',
  '@fortawesome/react-fontawesome',
  '@phosphor-icons/react',
  'phosphor-react',
  'react-feather',
  'feather-icons',
  '@tabler/icons-react',
  'bootstrap-icons',
];
const COLOR_PATTERNS = [
  /#[0-9a-fA-F]{3,8}\b/,
  /\brgba?\(/,
  /\bhsla?\(/,
  /\b(?:oklch|oklab|lab|lch|color)\(/,
  /:\s*(?:white|black|red|blue|green|yellow|orange|purple|pink|gray|grey|silver|navy|teal|olive|maroon|lime|aqua|fuchsia)\b/,
];

function listFiles(directory, extensions) {
  if (!existsSync(directory)) return [];
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...listFiles(path, extensions));
    if (entry.isFile() && extensions.has(extname(entry.name))) files.push(path);
  }
  return files;
}

function normalized(path) {
  return path.split(sep).join('/');
}

function withoutComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

function checkTheme(root, errors) {
  const globalsPath = join(root, GLOBALS_FILE);
  if (!existsSync(globalsPath)) {
    errors.push(`${normalized(GLOBALS_FILE)}: tema global ausente.`);
    return;
  }
  const globals = withoutComments(readFileSync(globalsPath, 'utf8'));
  if (!globals.includes("@import 'tailwindcss'")) {
    errors.push(`${normalized(GLOBALS_FILE)}: importe Tailwind uma única vez.`);
  }
  if (!globals.includes('@theme inline')) {
    errors.push(`${normalized(GLOBALS_FILE)}: declare o mapeamento semântico em @theme inline.`);
  }
  for (const token of REQUIRED_THEME_TOKENS) {
    if (!new RegExp(`(?:^|[^-\\w])${token}\\s*:`, 'm').test(globals)) {
      errors.push(`${normalized(GLOBALS_FILE)}: token obrigatório "${token}" não está declarado.`);
    }
  }

  const mainPath = join(root, WEB_ROOT, 'src', 'main.tsx');
  const main = existsSync(mainPath) ? readFileSync(mainPath, 'utf8') : '';
  if (!main.includes('./styles/globals.css')) {
    errors.push('apps/web/src/main.tsx: importe "./styles/globals.css" uma única vez.');
  }
  if (!main.includes('@fontsource-variable/archivo')) {
    errors.push('apps/web/src/main.tsx: importe a fonte Archivo auto-hospedada.');
  }

  const indexPath = join(root, WEB_ROOT, 'index.html');
  const html = existsSync(indexPath) ? readFileSync(indexPath, 'utf8') : '';
  if (!/<html[^>]*\sdata-theme=["']poe-crafter["']/.test(html)) {
    errors.push('apps/web/index.html: declare data-theme="poe-crafter".');
  }
}

function checkCss(root, errors) {
  const sourceRoot = join(root, WEB_ROOT, 'src');
  for (const file of listFiles(sourceRoot, new Set(['.css']))) {
    const label = normalized(relative(root, file));
    if (file.endsWith('.module.css')) {
      errors.push(`${label}: CSS Modules foi substituído por Tailwind.`);
    }
    if (normalized(relative(root, file)) === normalized(GLOBALS_FILE)) continue;
    const lines = withoutComments(readFileSync(file, 'utf8')).split('\n');
    lines.forEach((line, index) => {
      if (COLOR_PATTERNS.some((pattern) => pattern.test(line))) {
        errors.push(`${label}:${index + 1}: cor literal fora do tema global.`);
      }
    });
  }
}

function checkConfiguration(root, errors) {
  const packagePath = join(root, WEB_ROOT, 'package.json');
  if (!existsSync(packagePath)) {
    errors.push('apps/web/package.json: manifesto web ausente.');
    return;
  }
  const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));
  const dependencies = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
  for (const required of [ICON_LIBRARY, 'tailwindcss', '@tailwindcss/vite', 'shadcn']) {
    if (!dependencies[required]) errors.push(`apps/web/package.json: "${required}" é obrigatório.`);
  }
  if (dependencies['@vitru/styleguide']) {
    errors.push('apps/web/package.json: remova o sistema visual legado "@vitru/styleguide".');
  }
  for (const forbidden of FORBIDDEN_ICON_PACKAGES) {
    if (dependencies[forbidden]) {
      errors.push(`apps/web/package.json: "${forbidden}" concorre com "${ICON_LIBRARY}".`);
    }
  }

  const configPath = join(root, WEB_ROOT, 'components.json');
  if (!existsSync(configPath)) {
    errors.push('apps/web/components.json: configuração shadcn/ui ausente.');
  } else {
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    if (config.iconLibrary !== 'lucide')
      errors.push('components.json: iconLibrary deve ser "lucide".');
    if (config.tailwind?.baseColor !== 'neutral') {
      errors.push('components.json: tailwind.baseColor deve ser "neutral".');
    }
    if (config.aliases?.ui !== '@/shared/ui') {
      errors.push('components.json: aliases.ui deve apontar para "@/shared/ui".');
    }
  }

  for (const component of REQUIRED_COMPONENTS) {
    const path = join(root, WEB_ROOT, 'src', 'shared', 'ui', component);
    if (!existsSync(path))
      errors.push(`${normalized(relative(root, path))}: componente obrigatório ausente.`);
  }
}

function checkIcons(root, errors) {
  const sourceRoot = join(root, WEB_ROOT, 'src');
  for (const file of listFiles(sourceRoot, new Set(['.ts', '.tsx']))) {
    const label = normalized(relative(root, file));
    const content = readFileSync(file, 'utf8');
    for (const forbidden of FORBIDDEN_ICON_PACKAGES) {
      if (new RegExp(`from\\s+['"]${forbidden.replace(/[/@]/g, '\\$&')}`).test(content)) {
        errors.push(`${label}: importe ícones de "${ICON_LIBRARY}", não de "${forbidden}".`);
      }
    }
  }
}

export function checkStyleguide(root = defaultRoot) {
  const errors = [];
  checkTheme(root, errors);
  checkCss(root, errors);
  checkConfiguration(root, errors);
  checkIcons(root, errors);
  return errors;
}

function main() {
  const rootFlag = process.argv.indexOf('--root');
  const root = rootFlag >= 0 ? resolve(process.argv[rootFlag + 1]) : defaultRoot;
  const errors = checkStyleguide(root);
  if (errors.length === 0) {
    console.log('Verificação do styleguide OK.');
    return;
  }
  console.error('Verificação do styleguide FALHOU:\n');
  for (const error of errors) console.error(`  - ${error}`);
  process.exitCode = 1;
}

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) main();
