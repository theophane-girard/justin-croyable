import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, Button } from '@justin-croyable/mobile-ds';

// L'App monte l'UI Storybook (require.context, non disponible sous Vitest).
// On valide plutôt l'intégration Design System + NativeWind dans cette app.
describe('App', () => {
  it('rend le Design System dans l’app', () => {
    render(
      <ThemeProvider>
        <Button>Bonjour</Button>
      </ThemeProvider>
    );
    expect(screen.getByText('Bonjour')).toBeTruthy();
  });
});
