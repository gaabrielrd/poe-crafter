import { resolve } from 'node:path';
import { configDefaults, defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/test/setup.ts',
      exclude: [...configDefaults.exclude, '../../scripts/**/*.test.mjs', '../../e2e/**'],
      css: true,
      typecheck: {
        tsconfig: './tsconfig.app.json',
      },
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
        reportsDirectory: resolve(import.meta.dirname, '../../coverage'),
        include: ['src/**/*.{ts,tsx}'],
        exclude: [
          'src/test/**',
          'src/main.tsx',
          'src/vite-env.d.ts',
          'src/shared/ui/**',
          'src/app/styleguide/**',
        ],
        thresholds: {
          statements: 85,
          lines: 85,
          branches: 75,
          functions: 90,
        },
      },
    },
  }),
);
