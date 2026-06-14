import { StorybookConfig } from '@storybook/react-native';

const main: StorybookConfig = {
  // Les stories sont colocalisées avec les composants dans la lib mobile-ds.
  stories: ['../../../libs/mobile-ds/src/**/*.stories.?(ts|tsx)'],
  addons: [
    '@storybook/addon-ondevice-controls',
    '@storybook/addon-ondevice-actions',
  ],
};

export default main;
