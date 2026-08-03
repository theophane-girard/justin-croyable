import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const extensions = [
  '.web.tsx',
  '.tsx',
  '.web.ts',
  '.ts',
  '.web.jsx',
  '.jsx',
  '.web.js',
  '.js',
  '.json',
];

export default defineConfig({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/packages/storybook-host-test',
  define: {
    global: 'window',
    __DEV__: true,
  },
  resolve: {
    extensions,
    conditions: ['browser', 'import', 'require', 'default'],
    alias: {
      'react-native': 'react-native-web',
      'react-native-svg': 'react-native-svg-web',
      '@react-native/assets-registry/registry':
        'react-native-web/dist/modules/AssetRegistry/index',
    },
  },
  plugins: [react()],
  optimizeDeps: {
    esbuildOptions: {
      resolveExtensions: extensions,
      jsx: 'automatic',
      loader: { '.js': 'jsx' },
    },
  },
  test: {
    name: '@justin-croyable/storybook-host',
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.spec.{ts,tsx}'],
    server: {
      deps: {
        inline: [/react-native-web/, /react-native-svg/, /phosphor-react-native/],
      },
    },
  },
});
