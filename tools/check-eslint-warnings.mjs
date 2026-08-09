import { globSync, readFileSync } from 'node:fs';

// Plafond de warnings ESLint toléré sur l'ensemble du monorepo. Les règles de
// style sont taguées `warn` (elles ne bloquent pas le lint), ce garde-fou
// empêche donc d'en accumuler de nouveaux. Objectif : faire redescendre ce
// seuil au fil des corrections (cible visée : 40).
const DEFAULT_MAX_WARNINGS = 94;

const REPORT_PATTERNS = ['libs/*/eslint-report.json', 'packages/*/eslint-report.json'];

const parseMaxWarnings = () => {
  const fromArg = Number(process.argv[2]);
  const fromEnv = Number(process.env['ESLINT_MAX_WARNINGS']);
  const candidate = [fromArg, fromEnv].find(value => Number.isInteger(value) && value >= 0);
  return candidate ?? DEFAULT_MAX_WARNINGS;
};

const readReport = path => JSON.parse(readFileSync(path, 'utf8'));

const sumField = (results, field) =>
  results.reduce((total, result) => total + (result[field] ?? 0), 0);

const reportPaths = REPORT_PATTERNS.flatMap(pattern => globSync(pattern)).sort();

if (reportPaths.length === 0) {
  console.error(
    'Aucun rapport eslint-report.json trouvé. Lancer d’abord :\n' +
      '  npx nx run-many -t lint --all -- --format json --output-file eslint-report.json',
  );
  process.exit(1);
}

const maxWarnings = parseMaxWarnings();

const perReport = reportPaths.map(path => {
  const results = readReport(path);
  return {
    path,
    warnings: sumField(results, 'warningCount'),
    errors: sumField(results, 'errorCount'),
  };
});

const totalWarnings = sumField(perReport, 'warnings');
const totalErrors = sumField(perReport, 'errors');

perReport
  .filter(report => report.warnings > 0 || report.errors > 0)
  .forEach(report =>
    console.log(`  ${report.path} : ${report.warnings} warning(s), ${report.errors} erreur(s)`),
  );

console.log(`\nTotal : ${totalWarnings} warning(s), ${totalErrors} erreur(s) (plafond : ${maxWarnings}).`);

if (totalErrors > 0) {
  console.error(`\n❌ ${totalErrors} erreur(s) ESLint détectée(s).`);
  process.exit(1);
}

if (totalWarnings > maxWarnings) {
  console.error(
    `\n❌ ${totalWarnings} warnings ESLint > plafond de ${maxWarnings}.\n` +
      'Corriger les nouveaux warnings, ou les justifier, avant de fusionner.',
  );
  process.exit(1);
}

console.log(`\n✅ Sous le plafond de ${maxWarnings} warnings.`);
