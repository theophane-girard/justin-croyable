// Preset Tailwind « config JS » du Design System — @justin-croyable/design-system
//
// Le preset de référence est le CSS (`./src/theme/theme.css`), parce que les
// composants du DS sont écrits pour Tailwind v4, qui n'a plus de presets JS.
// Ce fichier existe pour les consommateurs qui ont encore besoin d'un objet de
// config JS :
//   - Tailwind v3 (ex. le track NativeWind du monorepo),
//   - un `@config` explicite en v4,
//   - tout outil qui veut lire les noms de tokens du DS par programme.
//
// Usage (Tailwind v3) :
//
//   module.exports = {
//     presets: [require('@justin-croyable/design-system/tailwind.preset')],
//     content: [
//       './src/**/*.{ts,html}',
//       './node_modules/@justin-croyable/design-system/src/**/*.ts',
//     ],
//   };
//
// Les variables CSS correspondantes doivent être présentes : importer
// `@justin-croyable/design-system/theme.css` (ou `primitives.css` + les rôles)
// dans le CSS de l'app.
//
// LIMITE CONNUE (v3 uniquement) : les rôles pointent vers des variables qui
// contiennent une couleur complète (`oklch(...)`), pas des canaux séparés. Les
// modificateurs d'opacité de Tailwind v3 (`bg-primary/80`) ne peuvent donc pas
// être calculés et sont ignorés. En v4, `theme.css` gère ce cas nativement via
// `color-mix()` — c'est une des raisons de préférer le preset CSS.

/** Rôle sémantique adossé à une variable CSS. */
const role = variable => `var(--${variable})`;

/** Rampe 50 → 900 d'une famille de primitives (`--primary-50`, …). */
function ramp(name) {
  return [50, 100, 200, 300, 400, 500, 600, 700, 800, 900].reduce((scale, step) => {
    scale[step] = role(`${name}-${step}`);
    return scale;
  }, {});
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Rôles — la seule chose que les composants du DS utilisent.
        background: role('background'),
        foreground: role('foreground'),
        border: role('border'),
        input: role('input'),
        ring: role('ring'),
        card: {
          DEFAULT: role('card'),
          foreground: role('card-foreground'),
        },
        popover: {
          DEFAULT: role('popover'),
          foreground: role('popover-foreground'),
        },
        // Marque : rôle (`bg-brand`) + rampe (`bg-brand-600`). Les valeurs
        // viennent de la palette sélectionnée (cf. `src/theme/palettes/*.css`).
        brand: {
          DEFAULT: role('brand'),
          ...ramp('brand'),
        },
        primary: {
          DEFAULT: role('primary'),
          foreground: role('primary-foreground'),
        },
        secondary: {
          DEFAULT: role('secondary'),
          foreground: role('secondary-foreground'),
        },
        muted: {
          DEFAULT: role('muted'),
          foreground: role('muted-foreground'),
        },
        accent: {
          DEFAULT: role('accent'),
          foreground: role('accent-foreground'),
        },
        destructive: role('destructive'),
        sidebar: {
          DEFAULT: role('sidebar'),
          foreground: role('sidebar-foreground'),
          primary: role('sidebar-primary'),
          'primary-foreground': role('sidebar-primary-foreground'),
          accent: role('sidebar-accent'),
          'accent-foreground': role('sidebar-accent-foreground'),
          border: role('sidebar-border'),
          ring: role('sidebar-ring'),
        },
        chart: {
          1: role('chart-1'),
          2: role('chart-2'),
          3: role('chart-3'),
          4: role('chart-4'),
          5: role('chart-5'),
        },

        // Sémantiques d'état.
        success: role('success'),
        warning: role('warning'),
        error: role('error'),
        info: role('info'),

        // Rampes brutes. Décoratif : ne jamais leur faire porter un statut.
        primaryScale: ramp('primary'),
        gray: ramp('gray'),
        orange: ramp('orange'),
        lime: ramp('lime'),
        cyan: ramp('cyan'),
        violet: ramp('violet'),
        rose: ramp('rose'),
        magenta: ramp('magenta'),
      },
      borderRadius: {
        sm: 'calc(var(--radius) - 4px)',
        md: 'calc(var(--radius) - 2px)',
        lg: 'var(--radius)',
        xl: 'calc(var(--radius) + 4px)',
      },
      // Typographie — `font-display`, `font-body`, `font-mono`. Valeurs partagées
      // (cf. `src/theme/primitives.css`) ; le chargement des fontes reste à l'app.
      fontFamily: {
        display: role('font-display'),
        body: role('font-body'),
        mono: role('font-mono'),
      },
    },
  },
};
