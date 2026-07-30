import {
  BadgeComponent,
  type BadgeShapeVariants,
  type BadgeTypeVariants,
} from '@justin-croyable/design-system';
import type { Meta, StoryObj } from '@storybook/angular';

type BadgeArgs = {
  type: BadgeTypeVariants;
  shape: BadgeShapeVariants;
  label: string;
};

const meta: Meta<BadgeArgs> = {
  title: 'Composants/Badge',
  component: BadgeComponent,
  tags: ['autodocs'],
  argTypes: {
    type: { control: 'select', options: ['default', 'secondary', 'destructive', 'outline'] },
    shape: { control: 'inline-radio', options: ['default', 'square', 'pill'] },
    label: { control: 'text' },
  },
  args: { type: 'default', shape: 'default', label: 'Badge' },
  render: args => ({
    props: args,
    template: `<app-badge [type]="type" [shape]="shape">{{ label }}</app-badge>`,
  }),
};

export default meta;
type Story = StoryObj<BadgeArgs>;

export const Default: Story = {};

export const Types: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="flex flex-wrap items-center gap-2">
        <app-badge type="default">Default</app-badge>
        <app-badge type="secondary">Secondary</app-badge>
        <app-badge type="destructive">Destructive</app-badge>
        <app-badge type="outline">Outline</app-badge>
      </div>
    `,
  }),
};

export const Shapes: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="flex flex-wrap items-center gap-2">
        <app-badge shape="default">Arrondi</app-badge>
        <app-badge shape="square">Carré</app-badge>
        <app-badge shape="pill">Pilule</app-badge>
      </div>
    `,
  }),
};

/** Cas d'usage typique : un compteur dans une pilule. */
export const Counter: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="flex items-center gap-2 text-sm">
        Notifications
        <app-badge shape="pill" type="destructive">12</app-badge>
      </div>
    `,
  }),
};
