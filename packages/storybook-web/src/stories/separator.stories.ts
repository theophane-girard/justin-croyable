import { SeparatorComponent } from '@justin-croyable/design-system';
import type { Meta, StoryObj } from '@storybook/angular-vite';

type SeparatorArgs = {
  orientation: 'horizontal' | 'vertical';
  decorative: boolean;
};

const meta: Meta<SeparatorArgs> = {
  title: 'Composants/Separator',
  component: SeparatorComponent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          "Séparateur visuel. `decorative` à `true` (par défaut) le retire de l'arbre d'accessibilité ; le passer à `false` en fait un `role=\"separator\"` annoncé, à réserver aux cas où le trait porte du sens. Le DS expose aussi `app-divider`, l'ancien nom côté zard.",
      },
    },
  },
  argTypes: {
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    decorative: { control: 'boolean' },
  },
  args: { orientation: 'horizontal', decorative: true },
  render: args => ({
    props: args,
    template: `
      <div class="flex h-24 w-80 items-center gap-4" [class.flex-col]="orientation === 'horizontal'">
        <span class="text-sm text-muted-foreground">Avant</span>
        <app-separator [orientation]="orientation" [decorative]="decorative" />
        <span class="text-sm text-muted-foreground">Après</span>
      </div>
    `,
  }),
};

export default meta;
type Story = StoryObj<SeparatorArgs>;

export const Horizontal: Story = {};

export const Vertical: Story = { args: { orientation: 'vertical' } };

export const InAList: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="w-64 rounded-lg border p-4">
        <p class="text-sm font-medium">Profil</p>
        <app-separator class="my-3" />
        <p class="text-sm font-medium">Sécurité</p>
        <app-separator class="my-3" />
        <p class="text-sm font-medium">Facturation</p>
      </div>
    `,
  }),
};
