import {
  ButtonComponent,
  type ButtonShape,
  type ButtonSize,
  type ButtonVariant,
} from '@justin-croyable/design-system/components/button';
import type { Meta, StoryObj } from '@storybook/angular-vite';

type ButtonArgs = {
  variant: ButtonVariant;
  size: ButtonSize;
  shape: ButtonShape;
  full: boolean;
  loading: boolean;
  buttonDisabled: boolean;
  label: string;
};

const meta: Meta<ButtonArgs> = {
  title: 'Composants/Button',
  component: ButtonComponent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          "Le bouton s'applique en attribut (`<button appButton>`), ce qui garde la sémantique et le comportement natifs du `<button>` ou du `<a>`. L'entrée publique s'appelle `variant` et alimente la variante cva `type`.",
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
    },
    size: {
      control: 'select',
      options: ['default', 'xs', 'sm', 'lg', 'icon', 'icon-xs', 'icon-sm', 'icon-lg'],
    },
    shape: { control: 'inline-radio', options: ['default', 'circle', 'square'] },
    full: { control: 'boolean' },
    loading: { control: 'boolean' },
    buttonDisabled: { control: 'boolean' },
    label: { control: 'text' },
  },
  args: {
    variant: 'default',
    size: 'default',
    shape: 'default',
    full: false,
    loading: false,
    buttonDisabled: false,
    label: 'Valider',
  },
  render: args => ({
    props: args,
    template: `
      <button
        appButton
        [variant]="variant"
        [size]="size"
        [shape]="shape"
        [full]="full"
        [loading]="loading"
        [buttonDisabled]="buttonDisabled"
      >
        {{ label }}
      </button>
    `,
  }),
};

export default meta;
type Story = StoryObj<ButtonArgs>;

export const Default: Story = {};

export const Variants: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="flex flex-wrap items-center gap-3">
        <button appButton variant="default">Default</button>
        <button appButton variant="secondary">Secondary</button>
        <button appButton variant="outline">Outline</button>
        <button appButton variant="ghost">Ghost</button>
        <button appButton variant="destructive">Destructive</button>
        <button appButton variant="link">Link</button>
      </div>
    `,
  }),
};

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="flex flex-wrap items-center gap-3">
        <button appButton size="xs">xs</button>
        <button appButton size="sm">sm</button>
        <button appButton size="default">default</button>
        <button appButton size="lg">lg</button>
      </div>
    `,
  }),
};

export const Loading: Story = {
  args: { loading: true, label: 'Envoi en cours' },
};

export const Disabled: Story = {
  args: { buttonDisabled: true, variant: 'outline', label: 'Indisponible' },
};

export const FullWidth: Story = {
  args: { full: true, label: 'Continuer' },
  render: args => ({
    props: args,
    template: `
      <div class="w-80">
        <button appButton [variant]="variant" [full]="full">{{ label }}</button>
      </div>
    `,
  }),
};
