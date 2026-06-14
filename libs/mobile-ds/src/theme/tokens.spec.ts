import {
  createTheme,
  defaultTheme,
  colorsToCssVars,
} from './tokens';

describe('createTheme', () => {
  it('retourne le thème par défaut sans surcharge', () => {
    const theme = createTheme();
    expect(theme).toEqual(defaultTheme);
  });

  it('fusionne les surcharges par mode sans écraser le reste', () => {
    const theme = createTheme({
      light: { primary: '124 58 237' },
      radius: 12,
    });

    expect(theme.light.primary).toBe('124 58 237');
    // les autres couleurs restent celles du thème de base
    expect(theme.light.background).toBe(defaultTheme.light.background);
    expect(theme.dark).toEqual(defaultTheme.dark);
    expect(theme.radius).toBe(12);
  });
});

describe('colorsToCssVars', () => {
  it('mappe les couleurs vers les variables CSS du preset', () => {
    const vars = colorsToCssVars(defaultTheme.light, 8);
    expect(vars['--color-primary']).toBe(defaultTheme.light.primary);
    expect(vars['--color-background']).toBe(defaultTheme.light.background);
    expect(vars['--radius']).toBe('8px');
  });
});
