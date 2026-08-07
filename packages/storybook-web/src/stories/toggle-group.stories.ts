import {
  type ToggleSizeVariants,
  type ToggleTypeVariants,
} from '@justin-croyable/design-system/components/toggle';
import {
  ToggleGroupComponent,
  type ToggleGroupItem,
} from '@justin-croyable/design-system/components/toggle-group';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, waitFor } from 'storybook/test';

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

const pressions = (canvasElement: HTMLElement): (string | null)[] =>
  [...canvasElement.querySelectorAll('[data-slot="toggle-group-item"]')].map(item =>
    item.getAttribute('aria-pressed'),
  );

export const Single: Story = {
  play: async ({ canvasElement }) => {
    expect(pressions(canvasElement)).toEqual(['true', 'false', 'false', 'false']);

    const items = canvasElement.querySelectorAll<HTMLElement>('[data-slot="toggle-group-item"]');
    await userEvent.click(items[2]);

    await waitFor(() => {
      expect(pressions(canvasElement)).toEqual(['false', 'false', 'true', 'false']);
    });
  },
};

export const Multiple: Story = {
  args: { mode: 'multiple', defaultValue: ['left', 'center'] },
  play: async ({ canvasElement }) => {
    expect(pressions(canvasElement)).toEqual(['true', 'true', 'false', 'false']);

    const items = canvasElement.querySelectorAll<HTMLElement>('[data-slot="toggle-group-item"]');
    await userEvent.click(items[2]);

    await waitFor(() => {
      expect(pressions(canvasElement)).toEqual(['true', 'true', 'true', 'false']);
    });

    await userEvent.click(items[0]);
    await waitFor(() => {
      expect(pressions(canvasElement)).toEqual(['false', 'true', 'true', 'false']);
    });
  },
};

export const Outline: Story = { args: { type: 'outline', spacing: 2 } };

export const Vertical: Story = { args: { orientation: 'vertical' } };

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    const items = [
      ...canvasElement.querySelectorAll<HTMLButtonElement>('[data-slot="toggle-group-item"]'),
    ];
    expect(items.every(item => item.disabled)).toBe(true);

    await userEvent.click(items[1], { pointerEventsCheck: 0 });
    expect(pressions(canvasElement)).toEqual(['true', 'false', 'false', 'false']);
  },
};
