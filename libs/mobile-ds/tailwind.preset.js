// Preset Tailwind du Design System mobile.
//
// À utiliser dans le `tailwind.config.js` de chaque application consommatrice :
//
//   module.exports = {
//     presets: [require('@justin-croyable/mobile-ds/tailwind.preset')],
//     content: [
//       './app/**/*.{ts,tsx}',
//       './node_modules/@justin-croyable/mobile-ds/src/**/*.{ts,tsx}',
//     ],
//   };
//
// Toutes les couleurs sont définies via des variables CSS (`--color-*`) injectées
// au runtime par le `ThemeProvider`. Cela permet :
//   - de personnaliser le thème par projet (objet `theme` passé au provider)
//   - de gérer dark / light en échangeant simplement le jeu de variables.
const nativewind = require('nativewind/preset');

/** Couleur sémantique adossée à une variable CSS, compatible avec l'opacité Tailwind. */
function withAlpha(variable) {
  return `rgb(var(${variable}) / <alpha-value>)`;
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [nativewind],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: withAlpha('--color-background'),
        foreground: withAlpha('--color-foreground'),
        border: withAlpha('--color-border'),
        input: withAlpha('--color-input'),
        ring: withAlpha('--color-ring'),
        card: {
          DEFAULT: withAlpha('--color-card'),
          foreground: withAlpha('--color-card-foreground'),
        },
        primary: {
          DEFAULT: withAlpha('--color-primary'),
          foreground: withAlpha('--color-primary-foreground'),
        },
        secondary: {
          DEFAULT: withAlpha('--color-secondary'),
          foreground: withAlpha('--color-secondary-foreground'),
        },
        muted: {
          DEFAULT: withAlpha('--color-muted'),
          foreground: withAlpha('--color-muted-foreground'),
        },
        accent: {
          DEFAULT: withAlpha('--color-accent'),
          foreground: withAlpha('--color-accent-foreground'),
        },
        destructive: {
          DEFAULT: withAlpha('--color-destructive'),
          foreground: withAlpha('--color-destructive-foreground'),
        },
        success: {
          DEFAULT: withAlpha('--color-success'),
          foreground: withAlpha('--color-success-foreground'),
        },
      },
      borderRadius: {
        sm: 'calc(var(--radius) - 4px)',
        md: 'calc(var(--radius) - 2px)',
        lg: 'var(--radius)',
        xl: 'calc(var(--radius) + 4px)',
      },
    },
  },
};
