const path = require('node:path');

/**
 * Enregistre l'entrée manager de `storybook-version` à la main.
 *
 * L'enregistrement normal (`addons: ['storybook-version']`) échoue ici :
 * Storybook résout l'addon en chemin absolu puis l'encode en URL, et le `é` de
 * `C:\Users\Théophane` devient `Th%C3%A9ophane`, que esbuild ne sait plus
 * résoudre. On fournit donc le chemin réel, en séparateurs POSIX.
 */
const managerEntry = require.resolve('storybook-version/manager').split(path.sep).join('/');

module.exports = {
  managerEntries: (entries = []) => [...entries, managerEntry],
};
