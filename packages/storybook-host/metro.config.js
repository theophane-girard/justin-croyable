const { withNxMetro } = require('@nx/react-native');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { withNativeWind } = require('nativewind/metro');
const withStorybook = require('@storybook/react-native/metro/withStorybook');
const path = require('path');

const defaultConfig = getDefaultConfig(__dirname);
const { assetExts, sourceExts } = defaultConfig.resolver;

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const customConfig = {
  cacheVersion: '@justin-croyable/storybook-host',
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  },
  resolver: {
    assetExts: assetExts.filter((ext) => ext !== 'svg'),
    sourceExts: [...sourceExts, 'cjs', 'mjs', 'svg'],
  },
};

module.exports = (async () => {
  const nxConfig = await withNxMetro(mergeConfig(defaultConfig, customConfig), {
    // Change this to true to see debugging info.
    // Useful if you have issues resolving modules
    debug: false,
    // all the file extensions used for imports other than 'ts', 'tsx', 'js', 'jsx', 'json'
    extensions: [],
    // Specify folders to watch, in addition to Nx defaults (workspace libraries and node_modules)
    watchFolders: [],
  });

  // Tailwind / NativeWind : compile la feuille de styles du Design System.
  // `disableTypeScriptGeneration` : on fournit nous-mêmes src/nativewind-env.d.ts
  // et on évite que NativeWind patche tsconfig.json (conflit avec nx sync).
  const nativeWindConfig = withNativeWind(nxConfig, {
    input: './global.css',
    disableTypeScriptGeneration: true,
  });

  // Storybook on-device : génère .storybook/storybook.requires.ts et sert l'UI.
  return withStorybook(nativeWindConfig, {
    enabled: true,
    configPath: path.resolve(__dirname, './.storybook'),
  });
})();
