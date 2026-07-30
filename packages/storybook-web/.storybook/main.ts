import type { StorybookConfig } from '@storybook/angular';

/**
 * Storybook web du Design System Angular (`@justin-croyable/design-system`).
 *
 * Lancement : `ng run storybook-web:storybook` (cf. `angular.json`). Storybook 10
 * n'accepte plus d'être démarré par son propre CLI sur Angular, il passe par un
 * builder Angular — c'est lui qui apporte le CSS global et le `tsConfig` utilisé
 * pour compiler stories et composants.
 *
 * `angular.json` déclare donc trois cibles, dont une cible `build` d'application
 * qui n'est jamais bundlée par Storybook : son `browserTarget` est obligatoire
 * (le framework rejette une config sans cible Angular explicite, y compris quand
 * `tsConfig` et `styles` sont fournis en direct — le schéma du builder le laisse
 * croire optionnel, le serveur de dev non). C'est de cette cible que viennent
 * les styles globaux et les assets.
 *
 * La lib DS est « source-only » (son `main` pointe sur `src/index.ts`, sans
 * étape de build) : ses sources doivent donc appartenir au même programme
 * TypeScript que les stories, ce que fait `.storybook/tsconfig.json` via son
 * `include` et son mapping `paths`.
 */
const config: StorybookConfig = {
  stories: ['../src/**/*.stories.ts'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: {
    name: '@storybook/angular',
    options: {},
  },
  core: {
    disableTelemetry: true,
  },
  docs: {
    defaultName: 'Docs',
  },
};

export default config;
