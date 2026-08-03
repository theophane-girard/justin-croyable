import { resolve } from 'path';
import { mergeConfig } from 'vite';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import type { StorybookConfig } from '@storybook/react-native-web-vite';

const tailwindConfig = resolve(import.meta.dirname, '../tailwind.config.js');

/**
 * Storybook **web** (navigateur) du Design System mobile.
 *
 * Réutilise les mêmes stories que l'app on-device, via le builder Vite
 * `@storybook/react-native-web-vite` (et non plus webpack) :
 *  - il alias `react-native` → `react-native-web` et strippe le Flow des
 *    dépendances React Native, ce que faisait auparavant l'addon
 *    `@storybook/addon-react-native-web` ;
 *  - `nativewind/babel` est injecté dans le plugin React pour transformer
 *    `className` ;
 *  - PostCSS + Tailwind traitent `global-web.css` pour générer les utilitaires.
 */
const config: StorybookConfig = {
  stories: ['../../../libs/mobile-ds/src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs'],
  framework: {
    name: '@storybook/react-native-web-vite',
    options: {
      pluginReactOptions: {
        babel: {
          babelrc: false,
          configFile: false,
          presets: ['nativewind/babel'],
        },
      },
    },
  },
  viteFinal: async (viteConfig) =>
    mergeConfig(viteConfig, {
      css: {
        postcss: {
          plugins: [tailwindcss(tailwindConfig), autoprefixer()],
        },
      },
    }),
};

export default config;
