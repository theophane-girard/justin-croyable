import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  ButtonComponent,
  EmptyComponent,
  FabButtonComponent,
  FabContainerComponent,
  FabListComponent,
  TableComponent,
} from '@justin-croyable/design-system';
import { NgIcon } from '@ng-icons/core';
import type { ColDef, GridOptions, RowSelectedEvent, ValueFormatterParams } from 'ag-grid-community';

import {
  cropUnit,
  HARVEST_UNIT,
  HARVEST_UNIT_META,
  type HarvestUnit,
} from '../../core/potager.model';
import { CatalogStore } from '../../core/catalog-store';
import { PriceStore } from '../../core/price-store';
import { UserStore } from '../../core/user-store';
import { TagCellComponent } from '../../shared/tag-cell.component';
import { ADMIN_PRICE_ADD_LINK } from '../../app.routes';

type AdminPriceRow = {
  readonly id: string;
  readonly varietyId: string;
  readonly varietyLabel: string;
  readonly unit: HarvestUnit;
  readonly conventionalPricePerKg: number;
  readonly bioPricePerKg: number | null;
  readonly source: string;
  readonly effectiveFrom: Date;
};

const PRICE_NUMBER_FORMATTER = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const DATE_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

function formatPriceCell(params: ValueFormatterParams<AdminPriceRow, number>): string {
  return typeof params.value === 'number' && params.data
    ? `${PRICE_NUMBER_FORMATTER.format(params.value)} ${HARVEST_UNIT_META[params.data.unit].priceSuffix}`
    : '—';
}

function formatDateCell(params: ValueFormatterParams<AdminPriceRow, Date>): string {
  return params.value instanceof Date ? DATE_FORMATTER.format(params.value) : '';
}

const PRICE_COLUMNS: ColDef<AdminPriceRow>[] = [
  {
    field: 'varietyLabel',
    headerName: 'Variété',
    minWidth: 200,
    flex: 1,
    cellRenderer: TagCellComponent,
    cellRendererParams: { color: 'info' },
  },
  {
    field: 'conventionalPricePerKg',
    headerName: 'Prix conv.',
    type: 'numericColumn',
    minWidth: 150,
    valueFormatter: formatPriceCell,
  },
  {
    field: 'bioPricePerKg',
    headerName: 'Prix bio',
    type: 'numericColumn',
    minWidth: 140,
    valueFormatter: formatPriceCell,
  },
  {
    field: 'source',
    headerName: 'Source',
    minWidth: 130,
    cellRenderer: TagCellComponent,
    cellRendererParams: { color: 'neutral' },
  },
  { field: 'effectiveFrom', headerName: 'Date effective', minWidth: 150, valueFormatter: formatDateCell },
];

const PRICE_GRID_OPTIONS: GridOptions<AdminPriceRow> = {
  rowSelection: { mode: 'singleRow', checkboxes: false, enableClickSelection: true },
  pagination: true,
  paginationPageSize: 10,
  paginationPageSizeSelector: [10, 20, 50],
};

@Component({
  selector: 'app-admin-prices',
  imports: [
    RouterLink,
    NgIcon,
    ButtonComponent,
    EmptyComponent,
    FabButtonComponent,
    FabContainerComponent,
    FabListComponent,
    TableComponent,
  ],
  template: `
    @if (!isAdmin()) {
      <app-empty
        icon="phosphorLock"
        title="Accès réservé"
        description="Cette page est réservée aux administrateurs."
      />
    } @else {
      <div class="flex flex-col gap-4">
        <div class="flex items-center justify-between gap-2">
          <div class="flex flex-col">
            <h2 class="text-foreground text-lg font-semibold">Administration des prix</h2>
            <p class="text-muted-foreground text-sm">
              Prix par variété utilisés pour valoriser les récoltes.
            </p>
          </div>
          <div class="flex items-center gap-2">
            <button
              appButton
              variant="outline"
              size="sm"
              [loading]="refreshing()"
              [buttonDisabled]="refreshing()"
              (click)="onRefreshRnm()"
            >
              <ng-icon name="phosphorCloudArrowDown" class="size-4" />
              Rafraîchir (RNM)
            </button>
            @if (rows().length > 0) {
              <div class="hidden items-center gap-2 sm:flex">
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
                <a appButton size="sm" [routerLink]="addLink">
                  <ng-icon name="phosphorPlus" class="size-4" />
                  Ajouter
                </a>
              </div>
            }
          </div>
        </div>

        @if (refreshError()) {
          <p class="text-destructive text-sm">{{ refreshError() }}</p>
        }

        @if (rows().length === 0) {
          <app-empty
            icon="phosphorCoins"
            title="Aucun prix"
            description="Ajoutez un premier prix par variété pour valoriser vos récoltes."
          >
            <a appButton [routerLink]="addLink">
              <ng-icon name="phosphorPlus" class="size-4" />
              Ajouter un prix
            </a>
          </app-empty>
        } @else {
          <app-table
            [rowData]="rows()"
            [columnDefs]="columns"
            [gridOptions]="gridOptions"
            (rowSelected)="onRowSelected($event)"
            height="30rem"
          />
        }
      </div>

      @if (rows().length > 0) {
        <app-fab
          class="sm:hidden"
          position="bottom-right"
          triggerIcon="phosphorDotsThreeVertical"
          triggerLabel="Actions sur les prix"
        >
          <app-fab-list>
            <a appFabButton [routerLink]="addLink" aria-label="Ajouter un prix">
              <ng-icon name="phosphorPlus" />
            </a>
            <button
              appFabButton
              type="button"
              variant="secondary"
              [buttonDisabled]="!selectedId()"
              (click)="onDelete()"
              aria-label="Supprimer la sélection"
            >
              <ng-icon name="phosphorTrash" />
            </button>
          </app-fab-list>
        </app-fab>
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPricesComponent {
  readonly #prices = inject(PriceStore);
  readonly #catalog = inject(CatalogStore);
  readonly #users = inject(UserStore);

  protected readonly isAdmin = this.#users.isAdmin;
  protected readonly refreshing = signal(false);
  protected readonly refreshError = signal<string | null>(null);
  protected readonly columns = PRICE_COLUMNS;
  protected readonly gridOptions = PRICE_GRID_OPTIONS;
  protected readonly addLink = ADMIN_PRICE_ADD_LINK;

  protected readonly selectedId = signal<string | null>(null);

  protected readonly rows = computed<AdminPriceRow[]>(() =>
    this.#prices
      .prices()
      .map(price => this.#toRow(price))
      .sort(
        (a, b) =>
          a.varietyLabel.localeCompare(b.varietyLabel, 'fr') ||
          b.effectiveFrom.getTime() - a.effectiveFrom.getTime(),
      ),
  );

  protected onRowSelected(event: RowSelectedEvent<AdminPriceRow>): void {
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
    void this.#prices.removePrice(id).then(succeeded => (succeeded ? this.selectedId.set(null) : undefined));
  }

  protected onRefreshRnm(): void {
    this.refreshing.set(true);
    this.refreshError.set(null);
    void this.#prices
      .refreshFromRnm()
      .then(succeeded => {
        if (!succeeded) {
          this.refreshError.set("L'import RNM a échoué. Réessaie plus tard.");
        }
      })
      .finally(() => this.refreshing.set(false));
  }

  #toRow(price: {
    readonly id: string;
    readonly varietyId: string;
    readonly conventionalPricePerKg: number;
    readonly bioPricePerKg: number | null;
    readonly source: string;
    readonly effectiveFrom: string;
  }): AdminPriceRow {
    const cropId = this.#catalog.byId().get(price.varietyId)?.cropId;
    return {
      id: price.id,
      varietyId: price.varietyId,
      varietyLabel: this.#catalog.labelFor(price.varietyId) ?? price.varietyId,
      unit: cropId ? cropUnit(cropId) : HARVEST_UNIT.kilogram,
      conventionalPricePerKg: price.conventionalPricePerKg,
      bioPricePerKg: price.bioPricePerKg,
      source: price.source,
      effectiveFrom: new Date(price.effectiveFrom),
    };
  }
}
