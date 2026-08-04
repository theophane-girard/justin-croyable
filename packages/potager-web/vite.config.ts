import angular from '@analogjs/vite-plugin-angular';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/potager-web',
  server: {
    port: 4300,
    host: 'localhost',
  },
  preview: {
    port: 4400,
    host: 'localhost',
  },
  build: {
    outDir: '../../dist/potager-web',
    emptyOutDir: true,
    reportCompressedSize: true,
    target: 'es2022',
  },
  plugins: [angular({ tsconfig: 'tsconfig.app.json' }), tailwindcss()],
}));
