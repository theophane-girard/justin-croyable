import { TableComponent } from '@justin-croyable/design-system';
import type { ColDef } from 'ag-grid-community';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { expect, waitFor } from 'storybook/test';

type Membre = {
  nom: string;
  role: string;
  equipe: string;
  contributions: number;
  actif: boolean;
};

type TableArgs = {
  rowData: Membre[];
  columnDefs: ColDef<Membre>[];
  height: string;
};

const membres: Membre[] = [
  { nom: 'Théophane Girard', role: 'Propriétaire', equipe: 'Plateforme', contributions: 412, actif: true },
  { nom: 'Maëlle Dupont', role: 'Éditrice', equipe: 'Design', contributions: 287, actif: true },
  { nom: 'Jean Rousseau', role: 'Utilisateur', equipe: 'Support', contributions: 96, actif: false },
  { nom: 'Amina Cherif', role: 'Éditrice', equipe: 'Plateforme', contributions: 341, actif: true },
  { nom: 'Luc Bernard', role: 'Utilisateur', equipe: 'Ventes', contributions: 54, actif: false },
];

const colonnes: ColDef<Membre>[] = [
  { field: 'nom', headerName: 'Nom', minWidth: 200 },
  { field: 'role', headerName: 'Rôle' },
  { field: 'equipe', headerName: 'Équipe' },
  { field: 'contributions', headerName: 'Contributions', type: 'numericColumn' },
  {
    field: 'actif',
    headerName: 'Actif',
    valueFormatter: params => (params.value ? 'Oui' : 'Non'),
  },
];

const meta: Meta<TableArgs> = {
  title: 'Composants/Table',
  component: TableComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          "Enveloppe `ag-grid-angular` (édition community). Le thème est construit avec l'API de thème d'AG Grid en pointant les variables CSS du DS : le tableau étant du DOM et non un canvas, il suit le thème sans JavaScript. Seule la partie de schéma clair / sombre est permutée au changement de thème. Nécessite `withTables()` dans les providers de l'application, qui enregistre les modules community.",
      },
    },
  },
  argTypes: {
    rowData: { control: 'object' },
    columnDefs: { control: false },
    height: { control: 'text' },
  },
  args: { rowData: membres, columnDefs: colonnes, height: '24rem' },
  render: args => ({
    props: args,
    template: `<app-table [rowData]="rowData" [columnDefs]="columnDefs" [height]="height" />`,
  }),
};

export default meta;
type Story = StoryObj<TableArgs>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      expect(canvasElement.querySelector('.ag-root-wrapper')).toBeTruthy();
    });

    await waitFor(() => {
      expect(canvasElement.querySelectorAll('.ag-row').length).toBe(membres.length);
    });

    const entetes = [...canvasElement.querySelectorAll('.ag-header-cell-text')].map(cell =>
      cell.textContent?.trim(),
    );
    expect(entetes).toContain('Contributions');
  },
};

export const Paginated: Story = {
  render: args => ({
    props: {
      ...args,
      rowData: Array.from({ length: 60 }, (_, index) => ({
        ...membres[index % membres.length],
        nom: `${membres[index % membres.length].nom} ${index + 1}`,
        contributions: 40 + index * 7,
      })),
      gridOptions: {
        pagination: true,
        paginationPageSize: 10,
        paginationPageSizeSelector: [10, 20, 50],
      },
    },
    template: `
      <app-table
        [rowData]="rowData"
        [columnDefs]="columnDefs"
        [gridOptions]="gridOptions"
        height="28rem"
      />
    `,
  }),
};

export const MultipleSelection: Story = {
  render: args => ({
    props: {
      ...args,
      gridOptions: { rowSelection: { mode: 'multiRow' } },
    },
    template: `
      <app-table [rowData]="rowData" [columnDefs]="columnDefs" [gridOptions]="gridOptions" />
    `,
  }),
};

export const Empty: Story = {
  args: { rowData: [] },
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      expect(canvasElement.querySelector('.ag-root-wrapper')).toBeTruthy();
    });
    expect(canvasElement.querySelectorAll('.ag-row').length).toBe(0);
  },
};
