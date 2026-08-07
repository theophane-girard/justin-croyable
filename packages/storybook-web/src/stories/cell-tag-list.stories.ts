import {
  CellTagListComponent,
  type CellTagListItem,
} from '@justin-croyable/design-system/components/table';
import { provideIcons } from '@ng-icons/core';
import { phosphorLeaf, phosphorTree } from '@ng-icons/phosphor-icons/regular';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, waitFor } from 'storybook/test';

type CellTagListArgs = {
  items: readonly CellTagListItem[];
  max: number;
};

const EQUIPES: readonly CellTagListItem[] = [
  { label: 'Plateforme', color: 'primary' },
  { label: 'Design', color: 'info' },
  { label: 'Support', color: 'neutral' },
  { label: 'Ventes', color: 'warning' },
  { label: 'Qualité', color: 'success' },
];

const meta: Meta<CellTagListArgs> = {
  title: 'Composants/Table/Cell tag list',
  component: CellTagListComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [provideIcons({ phosphorLeaf, phosphorTree })],
    }),
  ],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          "Liste de `app-cell-tag` bornée par `max` : au-delà, les tags restants sont condensés dans un badge `+N` dont le `appTooltip` révèle les libellés masqués. Utile pour une colonne multi-valeurs sans casser la hauteur de ligne.",
      },
    },
  },
  argTypes: {
    items: { control: 'object' },
    max: { control: { type: 'number', min: 0, step: 1 } },
  },
  args: { items: EQUIPES, max: 3 },
  render: args => ({
    props: args,
    template: `
      <div class="w-72">
        <app-cell-tag-list [items]="items" [max]="max" />
      </div>
    `,
  }),
};

export default meta;
type Story = StoryObj<CellTagListArgs>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      expect(canvasElement.querySelectorAll('app-cell-tag').length).toBe(3);
      expect(canvasElement.textContent).toContain('+2');
    });
  },
};

export const SansDebordement: Story = {
  args: { max: 5 },
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      expect(canvasElement.querySelectorAll('app-cell-tag').length).toBe(5);
      expect(canvasElement.textContent).not.toContain('+');
    });
  },
};

export const AvecIcones: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    props: {
      items: [
        { label: 'Tomate', color: 'primary', icon: 'phosphorLeaf' },
        { label: 'Fraise', color: 'danger', icon: 'phosphorTree' },
        { label: 'Carotte', color: 'primary', icon: 'phosphorLeaf' },
        { label: 'Pomme', color: 'success', icon: 'phosphorTree' },
      ] satisfies CellTagListItem[],
    },
    template: `
      <div class="w-72">
        <app-cell-tag-list [items]="items" [max]="2" />
      </div>
    `,
  }),
};
