import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: ['**/dist', '**/out-tsc', '**/vite.config.*.timestamp*'],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.cts', '**/*.mts'],
    rules: {
      'no-restricted-syntax': [
        'warn',
        {
          selector: 'TSEnumDeclaration',
          message: 'Pas d’enum : utiliser un objet `const … as const` et un type dérivé.',
        },
        {
          selector: 'ForStatement',
          message: 'Pas de boucle for : utiliser les méthodes déclaratives (map/filter/reduce…).',
        },
        {
          selector: 'ForInStatement',
          message: 'Pas de boucle for…in : utiliser les méthodes déclaratives (Object.entries/map…).',
        },
        {
          selector: 'ForOfStatement',
          message: 'Pas de boucle for…of : utiliser les méthodes déclaratives (map/filter/reduce…).',
        },
        {
          selector: 'CallExpression[callee.name="setTimeout"]',
          message: 'Pas de setTimeout (app zoneless) : utiliser observables, hooks de cycle de vie, etc.',
        },
        {
          selector: 'CallExpression[callee.name="queueMicrotask"]',
          message: 'Pas de queueMicrotask (app zoneless) : utiliser observables, hooks de cycle de vie, etc.',
        },
      ],
    },
  },
];
