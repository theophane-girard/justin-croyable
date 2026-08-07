import {
  type CellTagColor,
  CellTagComponent,
} from '@justin-croyable/design-system/components/table';
import { provideIcons } from '@ng-icons/core';
import {
  phosphorCheckCircle,
  phosphorInfo,
  phosphorLeaf,
  phosphorTag,
  phosphorTree,
  phosphorWarning,
  phosphorXCircle,
} from '@ng-icons/phosphor-icons/regular';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, waitFor } from 'storybook/test';

type CellTagArgs = {
  color: CellTagColor;
  label: string;
  icon: string;
};

const COLORS: CellTagColor[] = ['neutral', 'primary', 'success', 'warning', 'danger', 'info'];

const meta: Meta<CellTagArgs> = {
  title: 'Composants/Table/Cell tag',
  component: CellTagComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [
        provideIcons({
          phosphorCheckCircle,
          phosphorInfo,
          phosphorLeaf,
          phosphorTag,
          phosphorTree,
          phosphorWarning,
          phosphorXCircle,
        }),
      ],
    }),
  ],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          "Tag de cellule basé sur `app-badge` : une couleur sémantique (`color`), un libellé et une icône Phosphor optionnelle. Pensé pour matérialiser un statut ou une catégorie dans une colonne de `app-table`.",
      },
    },
  },
  argTypes: {
    color: { control: 'select', options: COLORS },
    label: { control: 'text' },
    icon: { control: 'text' },
  },
  args: { color: 'success', label: 'Actif', icon: 'phosphorCheckCircle' },
  render: args => ({
    props: args,
    template: `<app-cell-tag [color]="color" [label]="label" [icon]="icon" />`,
  }),
};

export default meta;
type Story = StoryObj<CellTagArgs>;

export const Default: Story = {};

export const Couleurs: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    props: { colors: COLORS },
    template: `
      <div class="flex flex-wrap items-center gap-2">
        @for (color of colors; track color) {
          <app-cell-tag [color]="color" [label]="color" />
        }
      </div>
    `,
  }),
};

export const AvecIcones: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="flex flex-wrap items-center gap-2">
        <app-cell-tag color="success" label="Validé" icon="phosphorCheckCircle" />
        <app-cell-tag color="warning" label="En attente" icon="phosphorWarning" />
        <app-cell-tag color="danger" label="Rejeté" icon="phosphorXCircle" />
        <app-cell-tag color="info" label="Info" icon="phosphorInfo" />
        <app-cell-tag color="primary" label="Légume" icon="phosphorLeaf" />
      </div>
    `,
  }),
};

export const SansIcone: Story = {
  args: { icon: '', label: 'Étiquette', color: 'neutral' },
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      expect(canvasElement.querySelector('app-cell-tag')?.textContent?.trim()).toBe('Étiquette');
      expect(canvasElement.querySelector('ng-icon')).toBeNull();
    });
  },
};
