import type { ReactElement } from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

import { ThemeProvider } from '../theme/theme-provider';
import { Switch } from './switch';
import { Checkbox } from './checkbox';
import { Avatar } from './avatar';
import { Modal } from './modal';
import { Segment } from './segment';
import { Select, MultiSelect } from './select';

const options = [
  { label: 'Un', value: 'un' },
  { label: 'Deux', value: 'deux' },
];

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

describe('Segment', () => {
  it('change de valeur au press sur une option', () => {
    const onChange = jest.fn();
    wrap(<Segment options={options} value="un" onValueChange={onChange} />);
    fireEvent.press(screen.getByText('Deux'));
    expect(onChange).toHaveBeenCalledWith('deux');
  });
});

describe('Select', () => {
  it('affiche le placeholder puis ouvre les options au press', () => {
    const onChange = jest.fn();
    wrap(
      <Select
        options={options}
        placeholder="Choisir"
        onValueChange={onChange}
      />
    );
    expect(screen.getByText('Choisir')).toBeTruthy();
    fireEvent.press(screen.getByText('Choisir'));
    fireEvent.press(screen.getByText('Deux'));
    expect(onChange).toHaveBeenCalledWith('deux');
  });
});

describe('MultiSelect', () => {
  it('ajoute une valeur sélectionnée', () => {
    const onChange = jest.fn();
    wrap(
      <MultiSelect
        options={options}
        values={[]}
        placeholder="Choisir"
        onValuesChange={onChange}
      />
    );
    fireEvent.press(screen.getByText('Choisir'));
    fireEvent.press(screen.getByText('Un'));
    expect(onChange).toHaveBeenCalledWith(['un']);
  });
});
