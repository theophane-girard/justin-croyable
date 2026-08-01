import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { storybookAngularVitest } from '@storybook/angular-vite/vitest';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig, type Plugin } from 'vitest/config';

const DOSSIER_STORIES = fileURLToPath(new URL('./src/stories', import.meta.url));

/**
 * Refuse de démarrer si une story est rangée dans un sous-dossier.
 *
 * La contrainte vient de la racine Vitest (voir `dir` plus bas) : l'addon
 * compare des chemins relatifs à cette racine, et le moindre séparateur y
 * réintroduit le bug d'antislash sous Windows. Une story nichée ne serait donc
 * jamais transformée en test.
 *
 * Elle n'apparaîtrait pas non plus dans le Storybook, dont le motif est resserré
 * de la même façon — mais compter là-dessus reviendrait à espérer que la
 * personne le remarque. Autant le dire ici, avec la raison.
 */
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
      `de la racine Vitest est nécessaire (voir le commentaire sur \`dir\`).`,
  );
}

verifierStoriesAPlat();

/**
 * Rend la garde générée par l'addon insensible au chemin percent-encodé.
 *
 * L'addon ajoute à chaque story un `if` qui ne déclare les tests que si le module
 * exécuté est bien celui demandé, en comparant `import.meta.url` au chemin du
 * worker Vitest. En mode navigateur `import.meta.url` est une URL HTTP, donc
 * percent-encodée, alors que le worker donne un chemin décodé. Le
 * `convertToFilePath` amont ne décode que `%20` : dès qu'un segment du chemin
 * sort de l'ASCII — un accent dans le nom d'utilisateur suffit — la comparaison
 * échoue, aucun test n'est déclaré, et Vitest signale « No test suite found ».
 *
 * On enveloppe donc l'appel d'un décodage complet. Si l'amont corrige ou remanie
 * ce code, la substitution ne s'applique plus et les tests redeviennent
 * introuvables : l'échec reste bruyant, jamais silencieux.
 */
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

/**
 * Exécute les stories comme tests.
 *
 * `storybookTest` transforme chaque story en cas de test : la story est rendue,
 * sa fonction `play` jouée, et toute erreur de rendu ou assertion échouée fait
 * échouer le test. Les stories sans `play` restent donc utiles — elles servent de
 * tests de fumée sur le rendu, ce qui couvre la classe de bugs qui nous a le plus
 * coûté ici (erreurs de template invisibles au build AOT).
 *
 * Le navigateur est réel (Playwright, Chromium) et non jsdom : AG Grid mesure des
 * dimensions et ECharts peint dans un canvas, deux choses que jsdom ne fait pas.
 *
 * `storybookAngularVitest` n'enregistre pas le plugin Angular — le framework le
 * fait — il transmet seulement les options de build Angular, dont le tsconfig
 * qui porte le mapping vers les sources de la lib DS.
 */
export default defineConfig({
  plugins: [
    storybookAngularVitest({ tsConfig: '.storybook/tsconfig.json' }),
    storybookTest({ configDir: '.storybook' }),
    // Après `storybookTest`, dont il retouche le code généré.
    decodeStoryPathGuard(),
  ],
  test: {
    name: 'storybook-web',
    /**
     * Vitest est enraciné sur le dossier des stories, et non sur le paquet.
     *
     * L'addon décide de transformer un fichier en test en comparant son chemin
     * relatif à cette racine aux motifs `stories` rendus relatifs de la même
     * façon. Ces deux chemins passent par `path.relative`, qui produit des
     * antislashs sous Windows — que micromatch lit comme des échappements, si
     * bien que plus rien ne correspond et qu'aucune story n'est transformée.
     *
     * En enracinant ici, le chemin relatif d'une story se réduit à son seul nom
     * de fichier et le motif à `*.stories.ts` : aucun séparateur, donc aucun
     * antislash, sur toutes les plateformes. C'est ce qui impose de garder les
     * stories à plat dans `src/stories` (cf. le motif de `.storybook/main.ts`).
     */
    dir: DOSSIER_STORIES,
    // Pas de `setupFiles` : depuis Storybook 10.3 l'addon applique lui-même les
    // annotations du `preview` (décorateurs, providers du DS, globals). Fournir
    // un fichier de setup qui appelle `setProjectAnnotations` lui ferait au
    // contraire sauter ce provisionnement.
    browser: {
      enabled: true,
      headless: true,
      /**
       * `--disable-dev-shm-usage` : Chromium place sa mémoire partagée dans
       * `/dev/shm`, dimensionné petit sur un runner. Une fois plein, le rendu
       * meurt sans crier gare et l'iframe atterrit sur une page d'erreur du
       * navigateur — d'où le « Received URL: unknown due to CORS » et le module
       * introuvable, sur un fichier de story différent à chaque exécution.
       */
      provider: playwright({
        launchOptions: { args: ['--disable-dev-shm-usage'] },
      }),
      instances: [{ browser: 'chromium' }],
    },
  },
});
