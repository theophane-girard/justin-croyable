import { globSync, readFileSync } from 'node:fs';

// Contrôle incrémental des warnings ESLint. Les règles de style sont taguées
// `warn` (elles ne bloquent pas le lint) ; ce garde-fou empêche d'en ajouter de
// nouveaux, projet par projet, sans relinter tout le monorepo. On ne lit que les
// rapports présents (ceux des projets affectés lintés par la CI) et on compare
// chaque projet au budget figé dans eslint-warnings-baseline.json. Corriger un
// warning existant sans toucher au budget reste vert ; en ajouter un échoue.
const BASELINE_PATH = new URL('./eslint-warnings-baseline.json', import.meta.url);

const REPORT_PATTERNS = ['libs/*/eslint-report.json', 'packages/*/eslint-report.json'];

const readReport = path => JSON.parse(readFileSync(path, 'utf8'));

const sumField = (results, field) =>
  results.reduce((total, result) => total + (result[field] ?? 0), 0);

const baseline = readReport(BASELINE_PATH);

const reportPaths = REPORT_PATTERNS.flatMap(pattern => globSync(pattern)).sort();

if (reportPaths.length === 0) {
  console.log('Aucun rapport ESLint : aucun projet affecté à vérifier.');
  process.exit(0);
}

const projects = reportPaths.map(path => {
  const project = path.replace(/\/eslint-report\.json$/, '');
  const results = readReport(path);
  return {
    project,
    warnings: sumField(results, 'warningCount'),
    errors: sumField(results, 'errorCount'),
    budget: baseline[project] ?? 0,
  };
});

projects
  .filter(({ warnings, errors }) => warnings > 0 || errors > 0)
  .forEach(({ project, warnings, budget, errors }) =>
    console.log(`  ${project} : ${warnings}/${budget} warning(s), ${errors} erreur(s)`),
  );

const withErrors = projects.filter(({ errors }) => errors > 0);
const overBudget = projects.filter(({ warnings, budget }) => warnings > budget);

if (withErrors.length > 0) {
  console.error(`\n❌ ${sumField(withErrors, 'errors')} erreur(s) ESLint détectée(s).`);
  process.exit(1);
}

if (overBudget.length > 0) {
  console.error('\n❌ Warnings ESLint au-dessus du budget du projet :');
  overBudget.forEach(({ project, warnings, budget }) =>
    console.error(`  ${project} : ${warnings} > ${budget} (+${warnings - budget})`),
  );
  console.error(
    '\nCorriger les nouveaux warnings, ou ajuster le budget dans ' +
      'tools/eslint-warnings-baseline.json si la hausse est justifiée.',
  );
  process.exit(1);
}

console.log('\n✅ Chaque projet affecté respecte son budget de warnings.');
