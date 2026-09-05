import js from '@eslint/js';
import globals from 'globals';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

const restrictedImports = {
  paths: [
    {
      name: 'react-router-dom',
      message: 'Importe de "react-router" (ADR 0004).',
    },
  ],
  patterns: [
    {
      group: [
        'react-icons',
        'react-icons/*',
        '@heroicons/*',
        '@mui/icons-material',
        '@mui/icons-material/*',
        '@fortawesome/*',
        '@phosphor-icons/*',
        'phosphor-react',
        'react-feather',
        'feather-icons',
        '@tabler/icons-react',
        'bootstrap-icons',
      ],
      message: 'A biblioteca de ícones do projeto é "lucide-react".',
    },
    {
      group: [
        'styled-components',
        '@emotion/*',
        '@mui/material',
        '@mui/material/*',
        'antd',
        'antd/*',
        '@chakra-ui/*',
        'react-bootstrap',
        'bootstrap',
        '@mantine/*',
      ],
      message: 'A interface usa Tailwind e componentes locais shadcn/ui.',
    },
  ],
};

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      'coverage/**',
      'node_modules/**',
      '.agents/skills/**',
      '.claude/skills/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommendedTypeChecked],
    files: ['apps/web/src/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'jsx-a11y': jsxA11y,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-restricted-imports': ['error', restrictedImports],
    },
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommendedTypeChecked],
    files: [
      'functions/src/**/*.ts',
      'packages/*/src/**/*.ts',
      'e2e/**/*.ts',
      'playwright.config.ts',
    ],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.node,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', 'apps/web/src/test/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: ['scripts/**/*.mjs', '*.config.{js,mjs}'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: globals.node,
    },
    rules: {
      'no-console': 'off',
      eqeqeq: ['error', 'smart'],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
);
