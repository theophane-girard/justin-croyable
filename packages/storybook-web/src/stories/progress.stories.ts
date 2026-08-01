import { ProgressComponent } from '@justin-croyable/design-system';
import type { Meta, StoryObj } from '@storybook/angular-vite';

type ProgressArgs = { value: number };

const meta: Meta<ProgressArgs> = {
  title: 'Composants/Progress',
  component: ProgressComponent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          "Barre de progression déterminée, de 0 à 100. Pour une attente de durée inconnue, utiliser `app-spinner` : une barre figée à une valeur arbitraire induit en erreur.",
      },
    },
  },
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 100, step: 1 } },
  },
  args: { value: 40 },
  render: args => ({
    props: args,
    template: `
      <div class="w-80">
        <app-progress [value]="value" />
      </div>
    `,
  }),
};

export default meta;
type Story = StoryObj<ProgressArgs>;

export const Default: Story = {};

export const Empty: Story = { args: { value: 0 } };

export const Complete: Story = { args: { value: 100 } };

export const Steps: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    props: { steps: [0, 25, 50, 75, 100] },
    template: `
      <div class="flex w-80 flex-col gap-4">
        @for (step of steps; track step) {
          <div class="flex items-center gap-3">
            <app-progress [value]="step" />
            <span class="w-10 text-right text-xs text-muted-foreground">{{ step }}%</span>
          </div>
        }
      </div>
    `,
  }),
};

export const WithLabel: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="w-80 space-y-2">
        <div class="flex items-baseline justify-between">
          <span class="text-sm font-medium">Import du catalogue</span>
          <span class="text-xs text-muted-foreground">62 %</span>
        </div>
        <app-progress [value]="62" />
      </div>
    `,
  }),
};
