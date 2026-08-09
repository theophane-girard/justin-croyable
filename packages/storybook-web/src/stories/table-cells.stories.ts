import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  type CellProgressBarColor,
  CellProgressBarComponent,
  CellLinkComponent,
  CellUserComponent,
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
type ResponsableCellule = {
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly avatarSrc: string;
};
type FicheCellule = { readonly href: string; readonly label: string };

type LigneProjet = {
  readonly tache: string;
  readonly responsable: ResponsableCellule;
  readonly statut: StatutCellule;
  readonly etiquettes: readonly CellTagListItem[];
  readonly avancement: AvancementCellule;
  readonly fiche: FicheCellule;
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

@Component({
  selector: 'app-responsable-cell',
  imports: [CellUserComponent],
  template: `
    @if (responsable(); as valeur) {
      <app-cell-user
        size="sm"
        [firstName]="valeur.firstName"
        [lastName]="valeur.lastName"
        [email]="valeur.email"
        [avatarSrc]="valeur.avatarSrc"
      />
    }
  `,
  host: { class: 'flex h-full w-full items-center' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class ResponsableCellRenderer implements ICellRendererAngularComp {
  protected readonly responsable = signal<ResponsableCellule | null>(null);

  agInit(params: ICellRendererParams<LigneProjet, ResponsableCellule>): void {
    this.responsable.set(params.value ?? null);
  }

  refresh(params: ICellRendererParams<LigneProjet, ResponsableCellule>): boolean {
    this.responsable.set(params.value ?? null);
    return true;
  }
}

@Component({
  selector: 'app-fiche-cell',
  imports: [CellLinkComponent],
  template: `
    @if (fiche(); as valeur) {
      <app-cell-link [href]="valeur.href" [label]="valeur.label" />
    }
  `,
  host: { class: 'flex h-full w-full items-center' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class FicheCellRenderer implements ICellRendererAngularComp {
  protected readonly fiche = signal<FicheCellule | null>(null);

  agInit(params: ICellRendererParams<LigneProjet, FicheCellule>): void {
    this.fiche.set(params.value ?? null);
  }

  refresh(params: ICellRendererParams<LigneProjet, FicheCellule>): boolean {
    this.fiche.set(params.value ?? null);
    return true;
  }
}

const lignes: LigneProjet[] = [
  {
    tache: 'Refonte du potager',
    responsable: {
      firstName: 'Théophane',
      lastName: 'Girard',
      email: 'theophane.girard@sensinov.com',
      avatarSrc: 'https://i.pravatar.cc/64?img=12',
    },
    statut: { label: 'Terminé', color: 'success', icon: 'phosphorCheckCircle' },
    etiquettes: [
      { label: 'Plateforme', color: 'primary', icon: 'phosphorLeaf' },
      { label: 'Design', color: 'info' },
      { label: 'Prioritaire', color: 'danger' },
    ],
    avancement: { value: 100, color: 'success' },
    fiche: { href: 'https://www.rnm.franceagrimer.fr', label: 'Cotations RNM' },
  },
  {
    tache: 'Import des récoltes',
    responsable: {
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada.lovelace@exemple.fr',
      avatarSrc: 'https://i.pravatar.cc/64?img=5',
    },
    statut: { label: 'En cours', color: 'info', icon: 'phosphorRocket' },
    etiquettes: [
      { label: 'Données', color: 'primary' },
      { label: 'API', color: 'neutral' },
    ],
    avancement: { value: 62, color: 'primary' },
    fiche: { href: 'https://angular.dev', label: 'Documentation' },
  },
  {
    tache: 'Alertes de prix',
    responsable: {
      firstName: '',
      lastName: '',
      email: 'alertes@exemple.fr',
      avatarSrc: '',
    },
    statut: { label: 'En attente', color: 'warning', icon: 'phosphorClockCountdown' },
    etiquettes: [
      { label: 'Notifications', color: 'info' },
      { label: 'Back', color: 'neutral' },
      { label: 'Front', color: 'neutral' },
      { label: 'QA', color: 'success' },
    ],
    avancement: { value: 28, color: 'warning' },
    fiche: { href: 'https://www.rnm.franceagrimer.fr', label: 'Barème détail' },
  },
  {
    tache: 'Migration Angular 21',
    responsable: {
      firstName: 'Grace',
      lastName: 'Hopper',
      email: 'grace.hopper@exemple.fr',
      avatarSrc: '',
    },
    statut: { label: 'À risque', color: 'danger', icon: 'phosphorWarning' },
    etiquettes: [{ label: 'Technique', color: 'primary', icon: 'phosphorTree' }],
    avancement: { value: 45, color: 'danger' },
    fiche: { href: 'https://angular.dev/roadmap', label: 'Feuille de route' },
  },
  {
    tache: 'Nettoyage du backlog',
    responsable: {
      firstName: 'Linus',
      lastName: 'Torvalds',
      email: 'linus.torvalds@exemple.fr',
      avatarSrc: 'https://i.pravatar.cc/64?img=33',
    },
    statut: { label: 'Annulé', color: 'neutral', icon: 'phosphorXCircle' },
    etiquettes: [
      { label: 'Interne', color: 'neutral' },
      { label: 'Docs', color: 'info' },
    ],
    avancement: { value: 0, color: 'neutral' },
    fiche: { href: 'https://github.com', label: 'Dépôt' },
  },
];

const colonnes: ColDef<LigneProjet>[] = [
  { field: 'tache', headerName: 'Tâche', minWidth: 200, flex: 1 },
  {
    field: 'responsable',
    headerName: 'Responsable',
    minWidth: 220,
    flex: 1,
    sortable: false,
    cellRenderer: ResponsableCellRenderer,
  },
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
  {
    field: 'fiche',
    headerName: 'Fiche',
    minWidth: 160,
    sortable: false,
    cellRenderer: FicheCellRenderer,
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
          'Assemblage des composants de cellule (`app-cell-user`, `app-cell-tag`, `app-cell-tag-list`, `app-cell-progress-bar`, `app-cell-link`) dans `app-table`. Chaque composant présentationnel est branché via un `cellRenderer` AG Grid minimal qui implémente `ICellRendererAngularComp` et mappe `params.value` sur les entrées du composant.',
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
      expect(canvasElement.querySelector('app-cell-user')).toBeTruthy();
      expect(canvasElement.querySelector('app-cell-tag')).toBeTruthy();
      expect(canvasElement.querySelector('app-cell-tag-list')).toBeTruthy();
      expect(canvasElement.querySelector('app-cell-progress-bar')).toBeTruthy();
      expect(canvasElement.querySelector('app-cell-link')).toBeTruthy();
    });

    await waitFor(() => {
      expect(canvasElement.textContent).toContain('Terminé');
      expect(canvasElement.textContent).toContain('+2');
      expect(canvasElement.querySelector('[role="progressbar"]')).toBeTruthy();
      expect(canvasElement.querySelector('a[target="_blank"]')).toBeTruthy();
    });
  },
};
