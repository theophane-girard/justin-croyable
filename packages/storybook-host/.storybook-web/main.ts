import type { StorybookConfig } from '@storybook/react-webpack5';
import { resolve } from 'path';

const workspaceRoot = resolve(__dirname, '../../..');

/**
 * Storybook **web** (navigateur) du Design System.
 *
 * Réutilise les mêmes stories que l'app on-device, via :
 *  - le builder webpack5 + l'addon react-native-web (alias react-native → react-native-web)
 *  - `nativewind/babel` injecté dans le babel-loader (transforme `className`)
 *  - PostCSS + Tailwind sur `global.css` pour générer le CSS des utilitaires.
 */
const config: StorybookConfig = {
  stories: ['../../../libs/mobile-ds/src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    {
      name: '@storybook/addon-react-native-web',
      options: {
        projectRoot: workspaceRoot,
        modulesToTranspile: [
          'nativewind',
          'react-native-css-interop',
          'react-native-reanimated',
          'phosphor-react-native',
          'react-native-svg',
        ],
        babelPresets: ['nativewind/babel'],
      },
    },
  ],
  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
  webpackFinal: async (cfg) => {
    const tailwindcss = require('tailwindcss');
    const autoprefixer = require('autoprefixer');
    const tailwindConfig = resolve(__dirname, '../tailwind.config.js');

    cfg.module?.rules?.forEach((rule) => {
      if (
        rule &&
        typeof rule === 'object' &&
        rule.test instanceof RegExp &&
        rule.test.test('x.css') &&
        Array.isArray(rule.use)
      ) {
        rule.use.push({
          loader: require.resolve('postcss-loader'),
          options: {
            postcssOptions: {
              plugins: [tailwindcss(tailwindConfig), autoprefixer],
            },
          },
        });
      }
    });

    // Outils de test : jamais nécessaires dans un bundle Storybook web.
    cfg.resolve = cfg.resolve ?? {};
    cfg.resolve.alias = {
      ...cfg.resolve.alias,
      '@testing-library/react-native': false,
      'react-test-renderer': false,
    };
    // Pas de polyfills node côté navigateur.
    cfg.resolve.fallback = {
      ...cfg.resolve.fallback,
      console: false,
      fs: false,
      path: false,
    };

    return cfg;
  },
};

export default config;
