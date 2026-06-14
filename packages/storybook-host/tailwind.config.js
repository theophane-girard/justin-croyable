/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('@justin-croyable/mobile-ds/tailwind.preset')],
  content: [
    './src/**/*.{ts,tsx}',
    './.storybook/**/*.{ts,tsx}',
    // indispensable : Tailwind doit voir les classes utilisées dans le Design System
    '../../libs/mobile-ds/src/**/*.{ts,tsx}',
  ],
};
