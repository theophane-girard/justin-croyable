import {
  ToggleComponent,
  type ToggleSizeVariants,
  type ToggleTypeVariants,
} from '@justin-croyable/design-system/components/toggle';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, waitFor } from 'storybook/test';

type ToggleArgs = {
  value: boolean;
  type: ToggleTypeVariants;
  size: ToggleSizeVariants;
  disabled: boolean;
  label: string;
};

const meta: Meta<ToggleArgs> = {
  title: 'Composants/Toggle',
  component: ToggleComponent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          "Bouton à deux états, pour une option qu'on active ou désactive dans une barre d'outils. `ariaLabel` est obligatoire : le contenu projeté est souvent une icône seule, sans texte annonçable. Pour un réglage de formulaire, préférer `app-switch`.",
      },
    },
  },
  argTypes: {
    value: { control: 'boolean' },
    type: { control: 'inline-radio', options: ['default', 'outline'] },
    size: { control: 'inline-radio', options: ['sm', 'default', 'lg'] },
    disabled: { control: 'boolean' },
    label: { control: 'text' },
  },
  args: { value: false, type: 'default', size: 'default', disabled: false, label: 'Gras' },
  render: args => ({
    props: args,
    template: `
      <app-toggle
        [(value)]="value"
        [type]="type"
        [size]="size"
        [disabled]="disabled"
        [ariaLabel]="label"
      >
        {{ label }}
      </app-toggle>
    `,
  }),
};

export default meta;
type Story = StoryObj<ToggleArgs>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const bascule = canvasElement.querySelector<HTMLElement>('[data-slot="toggle"]')!;
    expect(bascule.getAttribute('aria-pressed')).toBe('false');

    await userEvent.click(bascule);
    await waitFor(() => {
      expect(bascule.getAttribute('aria-pressed')).toBe('true');
      expect(bascule.getAttribute('data-state')).toBe('on');
    });

    await userEvent.click(bascule);
    await waitFor(() => {
      expect(bascule.getAttribute('aria-pressed')).toBe('false');
    });
  },
};

export const Pressed: Story = { args: { value: true } };

export const Outline: Story = { args: { type: 'outline' } };

export const Disabled: Story = { args: { disabled: true } };

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    props: { sm: false, md: true, lg: false },
    template: `
      <div class="flex items-center gap-3">
        <app-toggle size="sm" ariaLabel="Petit" [(value)]="sm">sm</app-toggle>
        <app-toggle size="default" ariaLabel="Moyen" [(value)]="md">default</app-toggle>
        <app-toggle size="lg" ariaLabel="Grand" [(value)]="lg">lg</app-toggle>
      </div>
    `,
  }),
};
