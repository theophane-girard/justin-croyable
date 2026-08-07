import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  type CellProgressBarColor,
  CellProgressBarComponent,
  type CellTagColor,
  CellTagComponent,
  CellTagListComponent,
  type CellTagListItem,
  TableComponent,
} from '@justin-croyable/design-system/components/table';
import { provideIcons } from '@ng-icons/core';
import {
  phosphorCheckCircle,
  phosphorClockCountdown,
  phosphorLeaf,
  phosphorRocket,
  phosphorTree,
  phosphorWarning,
  phosphorXCircle,
} from '@ng-icons/phosphor-icons/regular';
import type { ICellRendererAngularComp } from 'ag-grid-angular';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, waitFor } from 'storybook/test';

type StatutCellule = {
  readonly label: string;
  readonly color: CellTagColor;
  readonly icon: string;
};
type AvancementCellule = { readonly value: number; readonly color: CellProgressBarColor };

type LigneProjet = {
  readonly tache: string;
  readonly statut: StatutCellule;
  readonly etiquettes: readonly CellTagListItem[];
  readonly avancement: AvancementCellule;
};

@Component({
  selector: 'app-statut-cell',
  imports: [CellTagComponent],
  template: `
    @if (statut(); as valeur) {
      <app-cell-tag [color]="valeur.color" [label]="valeur.label" [icon]="valeur.icon" />
    }
  `,
  host: { class: 'flex h-full w-full items-center' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class StatutCellRenderer implements ICellRendererAngularComp {
  protected readonly statut = signal<StatutCellule | null>(null);

  agInit(params: ICellRendererParams<LigneProjet, StatutCellule>): void {
    this.statut.set(params.value ?? null);
  }

  refresh(params: ICellRendererParams<LigneProjet, StatutCellule>): boolean {
    this.statut.set(params.value ?? null);
    return true;
  }
}

@Component({
  selector: 'app-etiquettes-cell',
  imports: [CellTagListComponent],
  template: `<app-cell-tag-list [items]="etiquettes()" [max]="2" />`,
  host: { class: 'flex h-full w-full items-center' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class EtiquettesCellRenderer implements ICellRendererAngularComp {
  protected readonly etiquettes = signal<readonly CellTagListItem[]>([]);

  agInit(params: ICellRendererParams<LigneProjet, readonly CellTagListItem[]>): void {
    this.etiquettes.set(params.value ?? []);
  }

  refresh(params: ICellRendererParams<LigneProjet, readonly CellTagListItem[]>): boolean {
    this.etiquettes.set(params.value ?? []);
    return true;
  }
}

@Component({
  selector: 'app-avancement-cell',
  imports: [CellProgressBarComponent],
  template: `
    @if (avancement(); as valeur) {
      <app-cell-progress-bar [value]="valeur.value" [color]="valeur.color" />
    }
  `,
  host: { class: 'flex h-full w-full items-center' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class AvancementCellRenderer implements ICellRendererAngularComp {
  protected readonly avancement = signal<AvancementCellule | null>(null);

  agInit(params: ICellRendererParams<LigneProjet, AvancementCellule>): void {
    this.avancement.set(params.value ?? null);
  }

  refresh(params: ICellRendererParams<LigneProjet, AvancementCellule>): boolean {
    this.avancement.set(params.value ?? null);
    return true;
  }
}

const lignes: LigneProjet[] = [
  {
    tache: 'Refonte du potager',
    statut: { label: 'Terminé', color: 'success', icon: 'phosphorCheckCircle' },
    etiquettes: [
      { label: 'Plateforme', color: 'primary', icon: 'phosphorLeaf' },
      { label: 'Design', color: 'info' },
      { label: 'Prioritaire', color: 'danger' },
    ],
    avancement: { value: 100, color: 'success' },
  },
  {
    tache: 'Import des récoltes',
    statut: { label: 'En cours', color: 'info', icon: 'phosphorRocket' },
    etiquettes: [
      { label: 'Données', color: 'primary' },
      { label: 'API', color: 'neutral' },
    ],
    avancement: { value: 62, color: 'primary' },
  },
  {
    tache: 'Alertes de prix',
    statut: { label: 'En attente', color: 'warning', icon: 'phosphorClockCountdown' },
    etiquettes: [
      { label: 'Notifications', color: 'info' },
      { label: 'Back', color: 'neutral' },
      { label: 'Front', color: 'neutral' },
      { label: 'QA', color: 'success' },
    ],
    avancement: { value: 28, color: 'warning' },
  },
  {
    tache: 'Migration Angular 21',
    statut: { label: 'À risque', color: 'danger', icon: 'phosphorWarning' },
    etiquettes: [{ label: 'Technique', color: 'primary', icon: 'phosphorTree' }],
    avancement: { value: 45, color: 'danger' },
  },
  {
    tache: 'Nettoyage du backlog',
    statut: { label: 'Annulé', color: 'neutral', icon: 'phosphorXCircle' },
    etiquettes: [
      { label: 'Interne', color: 'neutral' },
      { label: 'Docs', color: 'info' },
    ],
    avancement: { value: 0, color: 'neutral' },
  },
];

const colonnes: ColDef<LigneProjet>[] = [
  { field: 'tache', headerName: 'Tâche', minWidth: 200, flex: 1 },
  {
    field: 'statut',
    headerName: 'Statut',
    minWidth: 150,
    sortable: false,
    cellRenderer: StatutCellRenderer,
  },
  {
    field: 'etiquettes',
    headerName: 'Étiquettes',
    minWidth: 220,
    flex: 1,
    sortable: false,
    cellRenderer: EtiquettesCellRenderer,
  },
  {
    field: 'avancement',
    headerName: 'Avancement',
    minWidth: 200,
    sortable: false,
    cellRenderer: AvancementCellRenderer,
  },
];

const meta: Meta = {
  title: 'Composants/Table/Cellules dans un tableau',
  component: TableComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [
        provideIcons({
          phosphorCheckCircle,
          phosphorClockCountdown,
          phosphorLeaf,
          phosphorRocket,
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
          'Assemblage des trois composants de cellule (`app-cell-tag`, `app-cell-tag-list`, `app-cell-progress-bar`) dans `app-table`. Chaque composant présentationnel est branché via un `cellRenderer` AG Grid minimal qui implémente `ICellRendererAngularComp` et mappe `params.value` sur les entrées du composant.',
      },
    },
  },
  render: () => ({
    props: { rowData: lignes, columnDefs: colonnes, gridOptions: { rowHeight: 52 } },
    template: `
      <app-table
        [rowData]="rowData"
        [columnDefs]="columnDefs"
        [gridOptions]="gridOptions"
        height="24rem"
      />
    `,
  }),
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      expect(canvasElement.querySelector('.ag-root-wrapper')).toBeTruthy();
      expect(canvasElement.querySelectorAll('.ag-row').length).toBe(lignes.length);
    });

    await waitFor(() => {
      expect(canvasElement.querySelector('app-cell-tag')).toBeTruthy();
      expect(canvasElement.querySelector('app-cell-tag-list')).toBeTruthy();
      expect(canvasElement.querySelector('app-cell-progress-bar')).toBeTruthy();
    });

    await waitFor(() => {
      expect(canvasElement.textContent).toContain('Terminé');
      expect(canvasElement.textContent).toContain('+2');
      expect(canvasElement.querySelector('[role="progressbar"]')).toBeTruthy();
    });
  },
};
