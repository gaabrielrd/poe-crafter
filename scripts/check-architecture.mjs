#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const defaultRoot = resolve(scriptDir, '..');
const sourceExtensions = new Set(['.ts', '.tsx']);
const INTERNAL_PACKAGES = new Set([
  '@poe-crafter/shared-types',
  '@poe-crafter/poe-data',
  '@poe-crafter/pricing',
  '@poe-crafter/functions',
  '@poe-crafter/web',
]);
const ALLOWED_INTERNAL_IMPORTS = {
  web: new Set(['@poe-crafter/shared-types']),
  functions: new Set([
    '@poe-crafter/shared-types',
    '@poe-crafter/poe-data',
    '@poe-crafter/pricing',
  ]),
  'shared-types': new Set(),
  'poe-data': new Set(['@poe-crafter/shared-types']),
  pricing: new Set(['@poe-crafter/shared-types']),
};

function listSourceFiles(directory) {
  if (!existsSync(directory)) return [];
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...listSourceFiles(path));
    if (entry.isFile() && sourceExtensions.has(extname(entry.name))) files.push(path);
  }
  return files;
}

function normalized(path) {
  return path.split(sep).join('/');
}

function featureFromPath(path) {
  const match = normalized(path).match(/(?:^|\/)features\/([^/]+)(?:\/|$)/);
  return match?.[1] ?? null;
}

function targetFromSpecifier(sourceFile, specifier, sourceRoot) {
  if (specifier.startsWith('@/')) return resolve(sourceRoot, specifier.slice(2));
  if (specifier.startsWith('.')) return resolve(dirname(sourceFile), specifier);
  return null;
}

function isPublicFeatureImport(specifier, targetPath) {
  if (/^@\/features\/[^/]+$/.test(specifier)) return true;
  return /\/features\/[^/]+(?:\/index)?$/.test(normalized(targetPath));
}

function parseSourceFile(sourceFile, content) {
  const scriptKind = extname(sourceFile) === '.tsx' ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  return ts.createSourceFile(sourceFile, content, ts.ScriptTarget.Latest, true, scriptKind);
}

function moduleSpecifiers(source) {
  const specifiers = [];

  function visit(node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      specifiers.push(node.moduleSpecifier.text);
    }
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      specifiers.push(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  }

  visit(source);
  return specifiers;
}

function isTestSource(path) {
  return path.includes('/tests/') || /(?:^|\/)tests?\//.test(path) || /\.test\.[^.]+$/.test(path);
}

function isServiceBoundary(path) {
  return /^(?:features\/[^/]+|shared)\/(?:services|adapters|repositories)\//.test(path);
}

function isGlobalMember(node, member) {
  return (
    ts.isPropertyAccessExpression(node) &&
    node.name.text === member &&
    ts.isIdentifier(node.expression) &&
    (node.expression.text === 'window' || node.expression.text === 'globalThis')
  );
}

function isImportMetaEnv(node) {
  return (
    ts.isPropertyAccessExpression(node) &&
    node.name.text === 'env' &&
    ts.isMetaProperty(node.expression) &&
    node.expression.keywordToken === ts.SyntaxKind.ImportKeyword &&
    node.expression.name.text === 'meta'
  );
}

function boundaryViolations(source, sourceRelative) {
  if (isTestSource(sourceRelative)) return [];
  const violations = new Set();

  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      ((ts.isIdentifier(node.expression) && node.expression.text === 'fetch') ||
        isGlobalMember(node.expression, 'fetch')) &&
      !isServiceBoundary(sourceRelative)
    ) {
      violations.add(
        `${sourceRelative}: chamadas fetch devem ficar em services, adapters ou repositories.`,
      );
    }

    if (
      ((ts.isPropertyAccessExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === 'localStorage') ||
        isGlobalMember(node, 'localStorage')) &&
      !isServiceBoundary(sourceRelative)
    ) {
      violations.add(
        `${sourceRelative}: acesso a localStorage deve ficar em services, adapters ou repositories.`,
      );
    }

    if (isImportMetaEnv(node) && sourceRelative !== 'shared/config/env.ts') {
      violations.add(`${sourceRelative}: leia import.meta.env somente por shared/config/env.ts.`);
    }

    ts.forEachChild(node, visit);
  }

  visit(source);
  return [...violations];
}

function internalPackageName(specifier) {
  if (!specifier.startsWith('@poe-crafter/')) return null;
  return specifier.split('/').slice(0, 2).join('/');
}

function checkWorkspaceImports(source, sourceLabel, workspace) {
  const errors = [];
  const allowed = ALLOWED_INTERNAL_IMPORTS[workspace] ?? new Set();
  for (const specifier of moduleSpecifiers(source)) {
    const packageName = internalPackageName(specifier);
    if (!packageName || !INTERNAL_PACKAGES.has(packageName)) continue;
    if (specifier !== packageName) {
      errors.push(`${sourceLabel}: importe "${packageName}" apenas por sua API pública.`);
      continue;
    }
    if (!allowed.has(packageName)) {
      errors.push(`${sourceLabel}: o workspace "${workspace}" não pode importar "${packageName}".`);
    }
  }
  return errors;
}

function checkWeb(root, errors) {
  const sourceRoot = join(root, 'apps', 'web', 'src');
  for (const sourceFile of listSourceFiles(sourceRoot)) {
    const sourceRelative = normalized(relative(sourceRoot, sourceFile));
    const sourceFeature = featureFromPath(sourceRelative);
    const sourceIsShared = sourceRelative.startsWith('shared/');
    const source = parseSourceFile(sourceFile, readFileSync(sourceFile, 'utf8'));

    errors.push(...boundaryViolations(source, sourceRelative));
    errors.push(...checkWorkspaceImports(source, `apps/web/src/${sourceRelative}`, 'web'));

    for (const specifier of moduleSpecifiers(source)) {
      const targetPath = targetFromSpecifier(sourceFile, specifier, sourceRoot);
      if (!targetPath) continue;
      const targetRelative = normalized(relative(sourceRoot, targetPath));
      const targetFeature = featureFromPath(targetRelative);

      if (sourceIsShared && targetFeature) {
        errors.push(`${sourceRelative}: shared não pode importar a feature "${targetFeature}".`);
        continue;
      }
      if (
        targetFeature &&
        targetFeature !== sourceFeature &&
        !isPublicFeatureImport(specifier, targetPath)
      ) {
        errors.push(
          `${sourceRelative}: importe a feature "${targetFeature}" apenas por sua interface pública.`,
        );
      }
    }
  }
}

function checkWorkspace(root, sourceDirectory, workspace, errors) {
  const sourceRoot = join(root, sourceDirectory);
  for (const sourceFile of listSourceFiles(sourceRoot)) {
    const label = normalized(relative(root, sourceFile));
    const source = parseSourceFile(sourceFile, readFileSync(sourceFile, 'utf8'));
    errors.push(...checkWorkspaceImports(source, label, workspace));
  }
}

export function checkArchitecture(root = defaultRoot) {
  const errors = [];
  checkWeb(root, errors);
  checkWorkspace(root, 'functions/src', 'functions', errors);
  checkWorkspace(root, 'packages/shared-types/src', 'shared-types', errors);
  checkWorkspace(root, 'packages/poe-data/src', 'poe-data', errors);
  checkWorkspace(root, 'packages/pricing/src', 'pricing', errors);
  return errors;
}

function main() {
  const rootFlag = process.argv.indexOf('--root');
  const root = rootFlag >= 0 ? resolve(process.argv[rootFlag + 1]) : defaultRoot;
  const errors = checkArchitecture(root);
  if (errors.length > 0) {
    console.error('Verificação arquitetural FALHOU:\n');
    for (const error of errors) console.error(`  - ${error}`);
    process.exitCode = 1;
    return;
  }
  console.log('Verificação arquitetural OK.');
}

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) main();
