import type { ReactElement } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { ThemeProvider } from '../theme/theme-provider';
import { Switch } from './switch';
import { Checkbox } from './checkbox';
import { Avatar } from './avatar';
import { Modal } from './modal';
import { Segment } from './segment';
import { Select, MultiSelect } from './select';
import { Header } from './header';
import { BottomSheet } from './bottom-sheet';
import { Fab } from './fab';
import { Accordion, AccordionItem } from './accordion';
import { DatePicker } from './date-picker';
import { ToastProvider, useToast } from './toast';
import { Plus } from 'phosphor-react-native';
import { Pressable } from 'react-native';
import { RadioGroup, Radio } from './radio';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';

const options = [
  { label: 'Un', value: 'un' },
  { label: 'Deux', value: 'deux' },
];

function wrap(ui: ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('Switch', () => {
  it('bascule la valeur au press', () => {
    const onChange = vi.fn();
    wrap(<Switch value={false} onValueChange={onChange} />);
    fireEvent.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe('Checkbox', () => {
  it('affiche le libellé et bascule au press', () => {
    const onChange = vi.fn();
    wrap(
      <Checkbox checked={false} onCheckedChange={onChange} label="Accepter" />
    );
    expect(screen.getByText('Accepter')).toBeTruthy();
    fireEvent.click(screen.getByRole('checkbox'));
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
    const onChange = vi.fn();
    wrap(<Segment options={options} value="un" onValueChange={onChange} />);
    fireEvent.click(screen.getByText('Deux'));
    expect(onChange).toHaveBeenCalledWith('deux');
  });
});

describe('Select', () => {
  it('affiche le placeholder puis ouvre les options au press', () => {
    const onChange = vi.fn();
    wrap(
      <Select
        options={options}
        placeholder="Choisir"
        onValueChange={onChange}
      />
    );
    expect(screen.getByText('Choisir')).toBeTruthy();
    fireEvent.click(screen.getByText('Choisir'));
    fireEvent.click(screen.getByText('Deux'));
    expect(onChange).toHaveBeenCalledWith('deux');
  });
});

describe('MultiSelect', () => {
  it('ajoute une valeur sélectionnée', () => {
    const onChange = vi.fn();
    wrap(
      <MultiSelect
        options={options}
        values={[]}
        placeholder="Choisir"
        onValuesChange={onChange}
      />
    );
    fireEvent.click(screen.getByText('Choisir'));
    fireEvent.click(screen.getByText('Un'));
    expect(onChange).toHaveBeenCalledWith(['un']);
  });
});

describe('Header', () => {
  it('affiche le titre et déclenche le retour', () => {
    const onBack = vi.fn();
    wrap(<Header title="Accueil" onBack={onBack} />);
    expect(screen.getByText('Accueil')).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Retour'));
    expect(onBack).toHaveBeenCalled();
  });
});

describe('BottomSheet', () => {
  it('rend son titre et son contenu quand visible', () => {
    wrap(
      <BottomSheet visible title="Partage">
        <Avatar name="A B" />
      </BottomSheet>
    );
    expect(screen.getByText('Partage')).toBeTruthy();
  });
});

describe('Fab', () => {
  it('déclenche onPress', () => {
    const onPress = vi.fn();
    wrap(
      <Fab icon={Plus} accessibilityLabel="Ajouter" onPress={onPress} />
    );
    fireEvent.click(screen.getByLabelText('Ajouter'));
    expect(onPress).toHaveBeenCalled();
  });
});

describe('Accordion', () => {
  it('affiche le contenu de la section ouverte par défaut', () => {
    wrap(
      <Accordion type="single" defaultValue="a">
        <AccordionItem value="a" title="Section A">
          <Avatar name="C D" />
        </AccordionItem>
      </Accordion>
    );
    expect(screen.getByText('Section A')).toBeTruthy();
  });
});

describe('DatePicker', () => {
  it('ouvre le calendrier et sélectionne un jour', () => {
    const onChange = vi.fn();
    wrap(
      <DatePicker
        value={new Date(2026, 5, 14)}
        onChange={onChange}
        label="Date"
      />
    );
    fireEvent.click(screen.getByText('14/06/2026'));
    fireEvent.click(screen.getByText('20'));
    expect(onChange).toHaveBeenCalled();
  });
});

describe('Toast', () => {
  it('affiche un toast déclenché via useToast', () => {
    function Trigger() {
      const { toast } = useToast();
      return (
        <Pressable onPress={() => toast({ title: 'Bonjour', duration: 0 })}>
          <Avatar name="E F" />
        </Pressable>
      );
    }
    render(
      <ThemeProvider>
        <ToastProvider>
          <Trigger />
        </ToastProvider>
      </ThemeProvider>
    );
    fireEvent.click(screen.getByText('EF'));
    expect(screen.getByText('Bonjour')).toBeTruthy();
  });
});

describe('Radio', () => {
  it('sélectionne une option', () => {
    const onChange = vi.fn();
    wrap(
      <RadioGroup value="a" onValueChange={onChange}>
        <Radio value="a" label="Option A" />
        <Radio value="b" label="Option B" />
      </RadioGroup>
    );
    fireEvent.click(screen.getByText('Option B'));
    expect(onChange).toHaveBeenCalledWith('b');
  });
});

describe('Tabs', () => {
  it('change de contenu au changement d’onglet', () => {
    wrap(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a" label="Onglet A" />
          <TabsTrigger value="b" label="Onglet B" />
        </TabsList>
        <TabsContent value="a">
          <Avatar name="A A" />
        </TabsContent>
        <TabsContent value="b">
          <Avatar name="B B" />
        </TabsContent>
      </Tabs>
    );
    expect(screen.getByText('AA')).toBeTruthy();
    expect(screen.queryByText('BB')).toBeNull();
    fireEvent.click(screen.getByText('Onglet B'));
    expect(screen.getByText('BB')).toBeTruthy();
  });
});
