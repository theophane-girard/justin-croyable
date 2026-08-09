import { SpinnerComponent } from '@justin-croyable/design-system/components/spinner';
import type { Meta, StoryObj } from '@storybook/angular-vite';

type SpinnerArgs = { class: string };

const meta: Meta<SpinnerArgs> = {
  title: 'Composants/Spinner',
  component: SpinnerComponent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          "Indicateur d'attente indéterminé. La taille et la couleur se pilotent par `class` ; `icon` accepte un `TemplateRef` pour remplacer l'icône par défaut. Le DS expose aussi `app-loader`, l'ancien nom de ce composant côté zard.",
      },
    },
  },
  argTypes: { class: { control: 'text' } },
  args: { class: 'size-6' },
  render: args => ({
    props: args,
    template: `<app-spinner [class]="class" />`,
  }),
};

export default meta;
type Story = StoryObj<SpinnerArgs>;

export const Default: Story = {};

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="flex items-center gap-6">
        <app-spinner class="size-4" />
        <app-spinner class="size-6" />
        <app-spinner class="size-8" />
      </div>
    `,
  }),
};

export const Colored: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="flex items-center gap-6">
        <app-spinner class="size-6 text-primary" />
        <app-spinner class="size-6 text-muted-foreground" />
        <app-spinner class="size-6 text-destructive" />
      </div>
    `,
  }),
};

export const InlineWithText: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="flex items-center gap-2 text-sm text-muted-foreground">
        <app-spinner class="size-4" />
        Chargement des données…
      </div>
    `,
  }),
};
