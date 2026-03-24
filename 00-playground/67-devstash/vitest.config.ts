import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src'),
    },
  },
  test: {
    environment: 'node',
    include: [
      'src/lib/**/*.{test,spec}.ts',
      'src/**/actions.{test,spec}.ts',
      'src/**/actions/**/*.{test,spec}.ts',
    ],
    exclude: ['**/node_modules/**', '**/.next/**', 'src/components/**'],
  },
});
