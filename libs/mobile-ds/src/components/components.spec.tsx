import type { ReactElement } from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

import { ThemeProvider } from '../theme/theme-provider';
import { Switch } from './switch';
import { Checkbox } from './checkbox';
import { Avatar } from './avatar';
import { Modal } from './modal';

function wrap(ui: ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('Switch', () => {
  it('bascule la valeur au press', () => {
    const onChange = jest.fn();
    wrap(<Switch value={false} onValueChange={onChange} />);
    fireEvent.press(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe('Checkbox', () => {
  it('affiche le libellé et bascule au press', () => {
    const onChange = jest.fn();
    wrap(
      <Checkbox checked={false} onCheckedChange={onChange} label="Accepter" />
    );
    expect(screen.getByText('Accepter')).toBeTruthy();
    fireEvent.press(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe('Avatar', () => {
  it('affiche les initiales sans image', () => {
    wrap(<Avatar name="Théo Girard" />);
    expect(screen.getByText('TG')).toBeTruthy();
  });
});

describe('Modal', () => {
  it('rend son titre et son contenu quand visible', () => {
    wrap(
      <Modal visible title="Confirmation">
        <Avatar name="A B" />
      </Modal>
    );
    expect(screen.getByText('Confirmation')).toBeTruthy();
  });
});
