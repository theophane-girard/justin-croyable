import tseslint from 'typescript-eslint';
import angular from 'angular-eslint';
import baseConfig from '../../eslint.config.mjs';

const magicStringFormAccess =
  'Pas de magic string pour naviguer dans un formulaire : extraire les noms de contrôles en constantes typées.';

const asWarnings = (configs) =>
  configs.map((config) =>
    config.rules
      ? {
          ...config,
          rules: Object.fromEntries(
            Object.entries(config.rules).map(([name, value]) => [
              name,
              Array.isArray(value) ? ['warn', ...value.slice(1)] : 'warn',
            ]),
          ),
        }
      : config,
  );

export default tseslint.config(
  ...baseConfig,
  {
    files: ['**/*.ts'],
    extends: asWarnings(angular.configs.tsRecommended),
    processor: angular.processInlineTemplates,
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/dot-notation': [
        'error',
        {
          allowKeywords: true,
          allowIndexSignaturePropertyAccess: true,
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'CallExpression[callee.property.name=/^(get|addControl|removeControl|setControl|contains)$/][arguments.0.type="Literal"]',
          message: magicStringFormAccess,
        },
        {
          selector:
            'MemberExpression[computed=true][object.property.name="controls"][property.type="Literal"]',
          message: magicStringFormAccess,
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: asWarnings(angular.configs.templateRecommended),
    rules: {},
  },
  {
    ignores: ['dist', 'out-tsc', 'node_modules'],
  },
);
