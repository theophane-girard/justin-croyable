import angular from '@analogjs/vite-plugin-angular';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig(() => ({
  root: import.meta.dirname,
  base: process.env['RESUME_BASE_HREF'] ?? '/',
  cacheDir: '../../node_modules/.vite/packages/resume',
  resolve: {
    mainFields: ['module'],
  },
  build: {
    outDir: '../../dist/packages/resume',
    emptyOutDir: true,
    reportCompressedSize: true,
  },
  server: {
    port: 4201,
    host: 'localhost',
  },
  preview: {
    port: 4301,
    host: 'localhost',
  },
  plugins: [angular({ tsconfig: './tsconfig.build.json' }), tailwindcss()],
}));
