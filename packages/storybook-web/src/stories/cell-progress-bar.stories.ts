import {
  type CellProgressBarColor,
  CellProgressBarComponent,
} from '@justin-croyable/design-system/components/table';
import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, waitFor } from 'storybook/test';

type CellProgressBarArgs = {
  value: number;
  color: CellProgressBarColor;
  showValue: boolean;
};

const COLORS: CellProgressBarColor[] = ['neutral', 'primary', 'success', 'warning', 'danger', 'info'];

const meta: Meta<CellProgressBarArgs> = {
  title: 'Composants/Table/Cell progress bar',
  component: CellProgressBarComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          "Barre de progression de cellule basée sur `app-progress` : une couleur sémantique (`color`) appliquée à l'indicateur et la valeur (0 à 100) affichée à droite. `showValue` masque le pourcentage pour une colonne compacte.",
      },
    },
  },
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 100, step: 1 } },
    color: { control: 'select', options: COLORS },
    showValue: { control: 'boolean' },
  },
  args: { value: 65, color: 'primary', showValue: true },
  render: args => ({
    props: args,
    template: `
      <div class="w-64">
        <app-cell-progress-bar [value]="value" [color]="color" [showValue]="showValue" />
      </div>
    `,
  }),
};

export default meta;
type Story = StoryObj<CellProgressBarArgs>;

export const Default: Story = {};

export const Couleurs: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    props: { rows: COLORS.map((color, index) => ({ color, value: 20 + index * 15 })) },
    template: `
      <div class="flex w-64 flex-col gap-3">
        @for (row of rows; track row.color) {
          <app-cell-progress-bar [value]="row.value" [color]="row.color" />
        }
      </div>
    `,
  }),
};

export const SansValeur: Story = {
  args: { showValue: false },
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      expect(canvasElement.querySelector('[role="progressbar"]')).toBeTruthy();
      expect(canvasElement.textContent).not.toContain('%');
    });
  },
};

export const Bornage: Story = {
  args: { value: 140 },
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      expect(canvasElement.textContent).toContain('100%');
      expect(canvasElement.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('100');
    });
  },
};
