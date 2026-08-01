import tailwindcss from '@tailwindcss/vite';
import type { StorybookConfig } from '@storybook/angular-vite';

/**
 * Storybook web du Design System Angular (`@justin-croyable/design-system`).
 *
 * Framework Vite (`@storybook/angular-vite`) et non webpack : c'est ce qui rend
 * `@storybook/addon-vitest` utilisable, les stories devenant des tests Vitest
 * exécutés en navigateur. Le lancement passe donc par le CLI Storybook, sans
 * `angular.json` ni cible `build` intermédiaire.
 *
 * La lib DS est « source-only » (son `main` pointe sur `src/index.ts`, sans étape
 * de build) : ses sources doivent appartenir au même programme TypeScript que les
 * stories, ce que fait `.storybook/tsconfig.json` via son `include` et son
 * mapping `paths`.
 */
const config: StorybookConfig = {
  // Un seul segment, sans joker de dossier : les stories sont à plat dans
  // `src/stories`, et `vitest.config.ts` s'appuie sur cette forme (voir le
  // commentaire sur `dir`). Une story rangée dans un sous-dossier n'apparaîtrait
  // pas dans le Storybook — c'est visible immédiatement, pas silencieux.
  stories: ['../src/stories/*.stories.ts'],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@storybook/addon-vitest',
    './version-addon.cjs',
  ],
  framework: {
    name: '@storybook/angular-vite',
    options: {
      // Compodoc extrait la documentation des composants pour les tables d'args.
      // Désactivé : il n'est pas installé, et `npx compodoc` télécharge alors un
      // homonyme sans rapport (le vrai paquet est `@compodoc/compodoc`), qui
      // échoue sur les arguments. Les contrôles sont de toute façon déclarés
      // explicitement dans les `argTypes` de chaque story.
      compodoc: false,
      tsconfig: './.storybook/tsconfig.json',
    },
  },
  core: {
    disableTelemetry: true,
  },
  /**
   * Tailwind v4 par son plugin Vite et non par PostCSS.
   *
   * Sous Vite, PostCSS est précédé de `postcss-import`, qui inline les `@import`
   * avant que Tailwind ne les voie — or Tailwind v4 doit résoudre les siens
   * lui-même pour enregistrer les thèmes. Le preset du DS était donc aplati et
   * `@apply bg-background` échouait sur une classe inconnue.
   */
  viteFinal: async config => {
    config.plugins = [...(config.plugins ?? []), tailwindcss()];
    return config;
  },
  docs: {
    defaultName: 'Docs',
  },
};

export default config;
