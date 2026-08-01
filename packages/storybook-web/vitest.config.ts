import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { storybookAngularVitest } from '@storybook/angular-vite/vitest';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig, type Plugin } from 'vitest/config';

const DOSSIER_STORIES = fileURLToPath(new URL('./src/stories', import.meta.url));

function verifierStoriesAPlat(): void {
  const racineSources = fileURLToPath(new URL('./src', import.meta.url));
  const egarees = readdirSync(racineSources, { recursive: true, withFileTypes: true })
    .filter(entree => entree.isFile() && entree.name.endsWith('.stories.ts'))
    .filter(entree => resolve(entree.parentPath) !== resolve(DOSSIER_STORIES))
    .map(entree => resolve(entree.parentPath, entree.name));

  if (egarees.length === 0) {
    return;
  }

  throw new Error(
    `Stories hors de src/stories, donc jamais exécutées comme tests :\n` +
      `${egarees.map(chemin => `  - ${chemin}`).join('\n')}\n` +
      `Les stories doivent être à plat dans src/stories tant que le contournement ` +
      `de la racine Vitest est nécessaire (voir le motif de \`.storybook/main.ts\`).`,
  );
}

verifierStoriesAPlat();

const APPEL_AMONT = 'convertToFilePath(import.meta.url)';

function decodeStoryPathGuard(): Plugin {
  return {
    name: 'ds:decode-story-path-guard',
    transform(code, id) {
      if (!id.includes('.stories.') || !code.includes(APPEL_AMONT)) {
        return null;
      }
      return code.replace(
        APPEL_AMONT,
        `((chemin) => { try { return decodeURIComponent(chemin); } catch { return chemin; } })(${APPEL_AMONT})`,
      );
    },
  };
}

export default defineConfig({
  plugins: [
    storybookAngularVitest({ tsConfig: '.storybook/tsconfig.json' }),
    storybookTest({ configDir: '.storybook' }),
    decodeStoryPathGuard(),
  ],
  test: {
    name: 'storybook-web',
    dir: DOSSIER_STORIES,
    browser: {
      enabled: true,
      headless: true,
      provider: playwright({
        launchOptions: { args: ['--disable-dev-shm-usage'] },
      }),
      instances: [{ browser: 'chromium' }],
    },
  },
});
