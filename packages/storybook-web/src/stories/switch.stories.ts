import {
  SwitchComponent,
  type SwitchSizeVariants,
  type SwitchTypeVariants,
} from '@justin-croyable/design-system';
import type { Meta, StoryObj } from '@storybook/angular';

type SwitchArgs = {
  checked: boolean;
  type: SwitchTypeVariants;
  size: SwitchSizeVariants;
  disabled: boolean;
};

const meta: Meta<SwitchArgs> = {
  title: 'Composants/Switch',
  component: SwitchComponent,
  tags: ['autodocs'],
  argTypes: {
    checked: { control: 'boolean' },
    type: { control: 'inline-radio', options: ['default', 'destructive'] },
    size: { control: 'inline-radio', options: ['sm', 'default', 'lg'] },
    disabled: { control: 'boolean' },
  },
  args: { checked: true, type: 'default', size: 'default', disabled: false },
  render: args => ({
    props: args,
    // `checked` est un `model()` : la liaison bidirectionnelle renvoie l'état
    // dans les args, donc le contrôle Storybook reste synchrone avec le clic.
    template: `
      <app-switch [(checked)]="checked" [type]="type" [size]="size" [disabled]="disabled" />
    `,
  }),
};

export default meta;
type Story = StoryObj<SwitchArgs>;

export const Default: Story = {};

export const Unchecked: Story = { args: { checked: false } };

export const Destructive: Story = { args: { type: 'destructive' } };

export const Disabled: Story = { args: { disabled: true } };

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    props: { sm: true, md: true, lg: true },
    template: `
      <div class="flex items-center gap-6">
        <app-switch size="sm" [(checked)]="sm" />
        <app-switch size="default" [(checked)]="md" />
        <app-switch size="lg" [(checked)]="lg" />
      </div>
    `,
  }),
};

/** Associé à un libellé cliquable via `id`. */
export const WithLabel: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    props: { notify: true },
    template: `
      <div class="flex items-center gap-3">
        <app-switch id="notify" [(checked)]="notify" />
        <label for="notify" class="cursor-pointer text-sm">Notifications par e-mail</label>
      </div>
    `,
  }),
};
