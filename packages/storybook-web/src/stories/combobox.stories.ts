import {
  ComboboxComponent,
  type ComboboxGroup,
  type ComboboxOption,
  type ComboboxWidthVariants,
} from '@justin-croyable/design-system/components/combobox';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, waitFor } from 'storybook/test';

type ComboboxArgs = {
  options: ComboboxOption[];
  groups: ComboboxGroup[];
  width: ComboboxWidthVariants;
  placeholder: string;
  prefixIcon: string;
  searchPlaceholder: string;
  emptyText: string;
  searchable: boolean;
  disabled: boolean;
  value: string | null;
  label: string;
  hint: string;
  required: boolean;
};

const frameworks: ComboboxOption[] = [
  { value: 'angular', label: 'Angular' },
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue' },
  { value: 'svelte', label: 'Svelte' },
  { value: 'ember', label: 'Ember', disabled: true },
];

const meta: Meta<ComboboxArgs> = {
  title: 'Composants/Combobox',
  component: ComboboxComponent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          "Composition de Popover + Command : un bouton déclencheur ouvre une liste filtrable. Les options se passent à plat via `options`, ou regroupées via `groups` (les deux entrées sont exclusives dans la pratique). `prefixIcon` affiche une icône (ng-icon) en préfixe du déclencheur. Sur mobile (< sm), la liste s'ouvre en bottom sheet ancré en bas — avec en-tête rappelant le champ, une poignée (glisser vers le haut pour agrandir, vers le bas pour fermer) et des animations d'ouverture/fermeture — au lieu du popover ancré.",
      },
    },
  },
  argTypes: {
    width: { control: 'inline-radio', options: ['sm', 'default', 'md', 'lg', 'full'] },
    placeholder: { control: 'text' },
    prefixIcon: { control: 'text', description: 'Nom d’icône (ng-icon) affichée en préfixe du déclencheur.' },
    searchPlaceholder: { control: 'text' },
    emptyText: { control: 'text' },
    searchable: { control: 'boolean' },
    disabled: { control: 'boolean' },
    options: { control: 'object' },
    groups: { control: false },
    value: { control: false },
    label: { control: 'text', description: 'Libellé visible, lié au déclencheur.' },
    hint: { control: 'text', description: 'Texte d’aide sous le contrôle.' },
    required: { control: 'boolean', description: 'Ajoute l’astérisque et aria-required.' },
  },
  args: {
    options: frameworks,
    groups: [],
    width: 'default',
    placeholder: 'Choisir un framework…',
    prefixIcon: '',
    searchPlaceholder: 'Rechercher…',
    emptyText: 'Aucun résultat.',
    searchable: true,
    disabled: false,
    value: null,
    label: '',
    hint: '',
    required: false,
  },
  render: args => ({
    props: args,
    template: `
      <app-combobox
        [options]="options"
        [groups]="groups"
        [width]="width"
        [placeholder]="placeholder"
        [prefixIcon]="prefixIcon"
        [searchPlaceholder]="searchPlaceholder"
        [emptyText]="emptyText"
        [searchable]="searchable"
        [disabled]="disabled"
        [label]="label"
        [hint]="hint"
        [required]="required"
        [value]="value"
      />
    `,
  }),
};

export default meta;
type Story = StoryObj<ComboboxArgs>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const declencheur = canvasElement.querySelector<HTMLElement>('[role="combobox"]')!;
    expect(declencheur.textContent).toContain('Choisir un framework…');

    await userEvent.click(declencheur);

    const liste = await waitFor(() => {
      const trouvee = document.querySelector<HTMLElement>('[role="listbox"]');
      expect(trouvee).toBeTruthy();
      return trouvee!;
    });
    expect(liste.querySelectorAll('[role="option"]').length).toBe(frameworks.length);

    await userEvent.type(document.querySelector<HTMLInputElement>('input')!, 'vu');
    await waitFor(() => {
      const restantes = [...liste.querySelectorAll('[role="option"]')].map(option =>
        option.textContent?.trim(),
      );
      expect(restantes).toEqual(['Vue']);
    });

    await userEvent.click(liste.querySelector<HTMLElement>('[role="option"]')!);
    await waitFor(() => {
      expect(declencheur.textContent).toContain('Vue');
      expect(document.querySelector('[role="listbox"]')).toBeNull();
    });
  },
};

export const WithLabelAndHint: Story = {
  args: {
    label: 'Framework',
    hint: 'Utilisé pour générer le squelette du projet.',
    required: true,
  },
};

export const Preselected: Story = { args: { value: 'angular' } };

export const WithoutSearch: Story = { args: { searchable: false } };

export const WithPrefixIcon: Story = {
  args: {
    label: 'Framework',
    prefixIcon: 'lucideSearch',
    placeholder: 'Rechercher un framework…',
  },
};

export const Disabled: Story = { args: { disabled: true } };

export const Grouped: Story = {
  args: {
    options: [],
    placeholder: 'Choisir une techno…',
    groups: [
      {
        label: 'Frontend',
        options: [
          { value: 'angular', label: 'Angular' },
          { value: 'react', label: 'React' },
        ],
      },
      {
        label: 'Backend',
        options: [
          { value: 'nest', label: 'NestJS' },
          { value: 'fastify', label: 'Fastify' },
        ],
      },
    ],
  },
};
