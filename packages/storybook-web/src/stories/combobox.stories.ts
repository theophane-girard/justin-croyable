import {
  ComboboxComponent,
  type ComboboxGroup,
  type ComboboxOption,
  type ComboboxWidthVariants,
} from '@justin-croyable/design-system';
import type { Meta, StoryObj } from '@storybook/angular';

type ComboboxArgs = {
  options: ComboboxOption[];
  groups: ComboboxGroup[];
  width: ComboboxWidthVariants;
  placeholder: string;
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
          "Composition de Popover + Command : un bouton déclencheur ouvre une liste filtrable. Les options se passent à plat via `options`, ou regroupées via `groups` (les deux entrées sont exclusives dans la pratique).",
      },
    },
  },
  argTypes: {
    width: { control: 'inline-radio', options: ['sm', 'default', 'md', 'lg', 'full'] },
    placeholder: { control: 'text' },
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

export const Default: Story = {};

export const WithLabelAndHint: Story = {
  args: {
    label: 'Framework',
    hint: 'Utilisé pour générer le squelette du projet.',
    required: true,
  },
};

export const Preselected: Story = { args: { value: 'angular' } };

export const WithoutSearch: Story = { args: { searchable: false } };

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
