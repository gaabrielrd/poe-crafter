import { resolve } from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, './src'),
      react: resolve(import.meta.dirname, './node_modules/react'),
      'react-dom': resolve(import.meta.dirname, './node_modules/react-dom'),
      'react/jsx-runtime': resolve(import.meta.dirname, './node_modules/react/jsx-runtime.js'),
      'react/jsx-dev-runtime': resolve(
        import.meta.dirname,
        './node_modules/react/jsx-dev-runtime.js',
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
});
