import {
  ToggleGroupComponent,
  type ToggleGroupItem,
  type ToggleSizeVariants,
  type ToggleTypeVariants,
} from '@justin-croyable/design-system';
import type { Meta, StoryObj } from '@storybook/angular-vite';

type ToggleGroupArgs = {
  items: ToggleGroupItem[];
  mode: 'single' | 'multiple';
  orientation: 'horizontal' | 'vertical';
  type: ToggleTypeVariants;
  size: ToggleSizeVariants;
  disabled: boolean;
  spacing: number;
  defaultValue: string | string[];
};

const alignement: ToggleGroupItem[] = [
  { value: 'left', label: 'Gauche', ariaLabel: 'Aligner à gauche' },
  { value: 'center', label: 'Centre', ariaLabel: 'Centrer' },
  { value: 'right', label: 'Droite', ariaLabel: 'Aligner à droite' },
  { value: 'justify', label: 'Justifié', ariaLabel: 'Justifier', disabled: true },
];

const meta: Meta<ToggleGroupArgs> = {
  title: 'Composants/Toggle Group',
  component: ToggleGroupComponent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          "Groupe de bascules piloté par l'entrée `items`, plutôt que par du contenu projeté. En mode `single` la valeur est une chaîne, en mode `multiple` un tableau. `spacing` à 0 accole les éléments en un segmenté.",
      },
    },
  },
  argTypes: {
    items: { control: 'object' },
    mode: { control: 'inline-radio', options: ['single', 'multiple'] },
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    type: { control: 'inline-radio', options: ['default', 'outline'] },
    size: { control: 'inline-radio', options: ['sm', 'default', 'lg'] },
    disabled: { control: 'boolean' },
    spacing: { control: { type: 'number', min: 0, max: 8 } },
    defaultValue: { control: false },
  },
  args: {
    items: alignement,
    mode: 'single',
    orientation: 'horizontal',
    type: 'default',
    size: 'default',
    disabled: false,
    spacing: 0,
    defaultValue: 'left',
  },
  render: args => ({
    props: args,
    template: `
      <app-toggle-group
        [items]="items"
        [mode]="mode"
        [orientation]="orientation"
        [type]="type"
        [size]="size"
        [disabled]="disabled"
        [spacing]="spacing"
        [defaultValue]="defaultValue"
      />
    `,
  }),
};

export default meta;
type Story = StoryObj<ToggleGroupArgs>;

export const Single: Story = {};

export const Multiple: Story = {
  args: { mode: 'multiple', defaultValue: ['left', 'center'] },
};

export const Outline: Story = { args: { type: 'outline', spacing: 2 } };

export const Vertical: Story = { args: { orientation: 'vertical' } };

export const Disabled: Story = { args: { disabled: true } };
