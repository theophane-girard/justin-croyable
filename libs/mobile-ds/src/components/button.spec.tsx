import { render, screen } from '@testing-library/react-native';

import { Button } from './button';
import { ThemeProvider } from '../theme/theme-provider';

describe('Button', () => {
  it('affiche son libellé', () => {
    render(
      <ThemeProvider>
        <Button>Valider</Button>
      </ThemeProvider>
    );
    expect(screen.getByText('Valider')).toBeTruthy();
  });

  it('expose un rôle bouton et l’état désactivé', () => {
    render(
      <ThemeProvider>
        <Button disabled>Valider</Button>
      </ThemeProvider>
    );
    const button = screen.getByRole('button');
    expect(button.props.accessibilityState.disabled).toBe(true);
  });
});
