import { render, screen } from '@testing-library/react-native';
import { ThemeProvider, Button } from '@justin-croyable/mobile-ds';

// L'App monte l'UI Storybook (require.context, non disponible sous Jest).
// On valide plutôt l'intégration Design System + NativeWind dans cette app.
test('le Design System se rend dans l’app', () => {
  render(
    <ThemeProvider>
      <Button>Bonjour</Button>
    </ThemeProvider>
  );
  expect(screen.getByText('Bonjour')).toBeTruthy();
});
