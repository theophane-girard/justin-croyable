import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  ButtonComponent,
  EmptyComponent,
  FabButtonComponent,
  TableComponent,
} from '@justin-croyable/design-system';
import { NgIcon } from '@ng-icons/core';
import type { ColDef, GridOptions, RowSelectedEvent, ValueFormatterParams } from 'ag-grid-community';

import { type HarvestRow } from '../../core/potager.model';
import { HarvestStore } from '../../core/harvest-store';
import { HARVEST_ADD_LINK } from '../../app.routes';

const DATE_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});
const KG_FORMATTER = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });
const EUR_FORMATTER = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });

function formatDateCell(params: ValueFormatterParams<HarvestRow, Date>): string {
  return params.value instanceof Date ? DATE_FORMATTER.format(params.value) : '';
}

function formatKgCell(params: ValueFormatterParams<HarvestRow, number>): string {
  return typeof params.value === 'number' ? KG_FORMATTER.format(params.value) : '';
}

function formatEurCell(params: ValueFormatterParams<HarvestRow, number>): string {
  return typeof params.value === 'number' ? EUR_FORMATTER.format(params.value) : '';
}

const HARVEST_COLUMNS: ColDef<HarvestRow>[] = [
  {
    field: 'harvestedOn',
    headerName: 'Date',
    minWidth: 150,
    sort: 'desc',
    valueFormatter: formatDateCell,
  },
  { field: 'cropLabel', headerName: 'Culture', minWidth: 150, flex: 1 },
  { field: 'categoryLabel', headerName: 'Catégorie', minWidth: 120 },
  { field: 'weightKg', headerName: 'Poids (kg)', type: 'numericColumn', valueFormatter: formatKgCell },
  {
    field: 'pricePerKg',
    headerName: 'Prix moyen (€/kg)',
    type: 'numericColumn',
    valueFormatter: formatEurCell,
  },
  { field: 'savingsEur', headerName: 'Économie', type: 'numericColumn', valueFormatter: formatEurCell },
];

const HARVEST_GRID_OPTIONS: GridOptions<HarvestRow> = {
  rowSelection: { mode: 'singleRow', checkboxes: false, enableClickSelection: true },
  pagination: true,
  paginationPageSize: 8,
  paginationPageSizeSelector: [8, 16, 32],
};

@Component({
  selector: 'app-harvests',
  imports: [
    RouterLink,
    NgIcon,
    ButtonComponent,
    FabButtonComponent,
    TableComponent,
    EmptyComponent,
  ],
  template: `
    <div class="flex flex-col gap-4">
      <div class="flex items-center justify-between gap-2">
        <div class="flex flex-col">
          <h2 class="text-foreground text-lg font-semibold">Récoltes</h2>
          <p class="text-muted-foreground text-sm">Économies estimées au prix moyen français.</p>
        </div>
        <div class="hidden items-center gap-2 sm:flex">
          @if (store.rows().length > 0) {
            <button
              appButton
              variant="outline"
              size="sm"
              [buttonDisabled]="!selectedId()"
              (click)="onDelete()"
            >
              <ng-icon name="phosphorTrash" class="size-4" />
              Supprimer la sélection
            </button>
          }
          <a appButton size="sm" [routerLink]="addLink">
            <ng-icon name="phosphorPlus" class="size-4" />
            Ajouter
          </a>
        </div>
      </div>

      @if (store.rows().length === 0) {
        <app-empty
          icon="phosphorBasket"
          title="Aucune récolte"
          description="Ajoutez une récolte pour la voir apparaître ici."
        >
          <a appButton [routerLink]="addLink">
            <ng-icon name="phosphorPlus" class="size-4" />
            Ajouter une récolte
          </a>
        </app-empty>
      } @else {
        <app-table
          [rowData]="store.rows()"
          [columnDefs]="columns"
          [gridOptions]="gridOptions"
          (rowSelected)="onRowSelected($event)"
          height="30rem"
        />
      }
    </div>

    @if (store.rows().length > 0) {
      <a
        appFabButton
        position="bottom-right"
        class="sm:hidden"
        [routerLink]="addLink"
        aria-label="Ajouter une récolte"
      >
        <ng-icon name="phosphorPlus" class="size-6" />
      </a>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HarvestsComponent {
  protected readonly store = inject(HarvestStore);

  protected readonly columns = HARVEST_COLUMNS;
  protected readonly gridOptions = HARVEST_GRID_OPTIONS;
  protected readonly addLink = HARVEST_ADD_LINK;

  protected readonly selectedId = signal<string | null>(null);

  protected onRowSelected(event: RowSelectedEvent<HarvestRow>): void {
    const row = event.data;
    if (!row) {
      return;
    }
    if (event.node.isSelected()) {
      this.selectedId.set(row.id);
      return;
    }
    if (this.selectedId() === row.id) {
      this.selectedId.set(null);
    }
  }

  protected onDelete(): void {
    const id = this.selectedId();
    if (id === null) {
      return;
    }
    this.store.remove(id);
    this.selectedId.set(null);
  }
}
