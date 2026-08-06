import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  ButtonComponent,
  CardComponent,
  CountUpDirective,
  EmptyComponent,
  FabButtonComponent,
  FabContainerComponent,
  FabListComponent,
  SegmentComponent,
  type SegmentItem,
  SelectImports,
  TableComponent,
} from '@justin-croyable/design-system';
import { NgIcon } from '@ng-icons/core';
import type { ColDef, GridOptions, RowSelectedEvent, ValueFormatterParams } from 'ag-grid-community';

import {
  isSeasonFilter,
  type PlantRow,
  SEASON,
  SEASON_FILTER_ALL,
  SEASON_META,
} from '../../core/potager.model';
import { buildYearOptions, parseYearValue, yearFilterToValue } from '../../core/period-selector';
import { GardenStore } from '../../core/garden-store';
import { HarvestStore } from '../../core/harvest-store';
import { SeasonStore } from '../../core/season-store';
import { GARDEN_ADD_LINK } from '../../app.routes';

const NUMBER_FORMATTER = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const KG_FORMATTER = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });
const EUR_FORMATTER = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
const YIELD_FORMATTER = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatCountCell(params: ValueFormatterParams<PlantRow, number>): string {
  return typeof params.value === 'number' ? NUMBER_FORMATTER.format(params.value) : '';
}

function formatKgCell(params: ValueFormatterParams<PlantRow, number>): string {
  return typeof params.value === 'number' ? KG_FORMATTER.format(params.value) : '';
}

function formatEurCell(params: ValueFormatterParams<PlantRow, number>): string {
  return typeof params.value === 'number' ? EUR_FORMATTER.format(params.value) : '';
}

function formatYieldCell(params: ValueFormatterParams<PlantRow, number>): string {
  return typeof params.value === 'number' ? `${YIELD_FORMATTER.format(params.value)} kg/plant` : '';
}

const PLANT_COLUMNS: ColDef<PlantRow>[] = [
  { field: 'cropLabel', headerName: 'Culture', minWidth: 150, flex: 1 },
  { field: 'categoryLabel', headerName: 'Catégorie', minWidth: 110 },
  { field: 'quantity', headerName: 'Plants', type: 'numericColumn', valueFormatter: formatCountCell },
  { field: 'harvestedKg', headerName: 'Récolté (kg)', type: 'numericColumn', valueFormatter: formatKgCell },
  {
    field: 'yieldPerPlantKg',
    headerName: 'Rendement / plant',
    type: 'numericColumn',
    minWidth: 160,
    valueFormatter: formatYieldCell,
  },
  {
    field: 'harvestValueEur',
    headerName: 'Valeur récoltée',
    type: 'numericColumn',
    minWidth: 140,
    valueFormatter: formatEurCell,
  },
  {
    field: 'expenseEur',
    headerName: 'Dépenses',
    type: 'numericColumn',
    minWidth: 120,
    valueFormatter: formatEurCell,
  },
  {
    field: 'netSavingsEur',
    headerName: 'Économie',
    type: 'numericColumn',
    minWidth: 120,
    valueFormatter: formatEurCell,
  },
];

const PLANT_GRID_OPTIONS: GridOptions<PlantRow> = {
  rowSelection: { mode: 'singleRow', checkboxes: false, enableClickSelection: true },
  pagination: true,
  paginationPageSize: 8,
  paginationPageSizeSelector: [8, 16, 32],
};

const SEASON_FILTER_ITEMS: SegmentItem[] = [
  { value: SEASON_FILTER_ALL, label: 'Année entière' },
  { value: SEASON.summer, label: SEASON_META.summer.label, icon: SEASON_META.summer.icon },
  { value: SEASON.winter, label: SEASON_META.winter.label, icon: SEASON_META.winter.icon },
];

@Component({
  selector: 'app-garden',
  imports: [
    RouterLink,
    NgIcon,
    ButtonComponent,
    CardComponent,
    CountUpDirective,
    SegmentComponent,
    FabButtonComponent,
    FabContainerComponent,
    FabListComponent,
    TableComponent,
    EmptyComponent,
    ...SelectImports,
  ],
  template: `
    <div class="flex flex-col gap-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-col">
          <h2 class="text-foreground text-lg font-semibold">Mon jardin</h2>
          <p class="text-muted-foreground text-sm">
            Plants cultivés, rendement et économie nette par plant.
          </p>
        </div>
        <div class="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap">
          @if (showYearSelector()) {
            <app-select
              class="w-36"
              prefixIcon="phosphorCalendarBlank"
              [value]="yearValue()"
              (valueChange)="onYearChange($event)"
            >
              @for (option of yearOptions(); track option.value) {
                <app-select-item [value]="option.value">{{ option.label }}</app-select-item>
              }
            </app-select>
          }
          <app-segment
            class="order-last w-full rounded-md sm:order-none sm:w-auto"
            variant="accent"
            [items]="seasonItems"
            [value]="season.season()"
            (valueChange)="onSeasonChange($event)"
          />
          @if (store.rows().length > 0) {
            <button
              appButton
              variant="outline"
              size="sm"
              class="hidden sm:inline-flex"
              [buttonDisabled]="!selectedId()"
              (click)="onDelete()"
            >
              <ng-icon name="phosphorTrash" class="size-4" />
              Supprimer
            </button>
          }
          <a appButton size="sm" class="hidden sm:inline-flex" [routerLink]="addLink">
            <ng-icon name="phosphorPlus" class="size-4" />
            Ajouter
          </a>
        </div>
      </div>

      @if (store.rows().length === 0) {
        <app-empty
          icon="phosphorPottedPlant"
          title="Aucun plant"
          description="Ajoutez vos plants pour suivre le rendement de votre potager."
        >
          <a appButton [routerLink]="addLink">
            <ng-icon name="phosphorPlus" class="size-4" />
            Ajouter un plant
          </a>
        </app-empty>
      } @else {
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <app-card>
            <div class="flex items-center justify-between">
              <div class="flex flex-col gap-1">
                <span class="text-muted-foreground text-sm">Plants cultivés</span>
                <span class="text-foreground text-3xl font-bold tabular-nums">
                  <span appCountUp>{{ store.plantCount() }}</span>
                </span>
              </div>
              <div class="bg-secondary text-secondary-foreground flex size-10 items-center justify-center rounded-lg">
                <ng-icon name="phosphorPottedPlant" class="size-5" />
              </div>
            </div>
          </app-card>

          <app-card>
            <div class="flex items-center justify-between">
              <div class="flex flex-col gap-1">
                <span class="text-muted-foreground text-sm">Économie nette</span>
                <span class="text-primary text-3xl font-bold tabular-nums">
                  <span appCountUp>{{ store.totalNetSavingsEur() }}</span> €
                </span>
              </div>
              <div class="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
                <ng-icon name="phosphorPiggyBank" class="size-5" />
              </div>
            </div>
          </app-card>

          <app-card>
            <div class="flex items-center justify-between">
              <div class="flex flex-col gap-1">
                <span class="text-muted-foreground text-sm">Rendement moyen</span>
                <span class="text-foreground text-2xl font-bold tabular-nums">
                  <span appCountUp>{{ store.averageYieldPerPlantKg() }}</span> kg/plant
                </span>
              </div>
              <div class="bg-secondary text-secondary-foreground flex size-10 items-center justify-center rounded-lg">
                <ng-icon name="phosphorTrendUp" class="size-5" />
              </div>
            </div>
          </app-card>
        </div>

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
      <app-fab class="sm:hidden" position="bottom-right" triggerLabel="Actions sur le jardin">
        <app-fab-list>
          <a appFabButton [routerLink]="addLink" aria-label="Ajouter un plant">
            <ng-icon name="phosphorPlus" />
          </a>
        </app-fab-list>
      </app-fab>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GardenComponent {
  protected readonly store = inject(GardenStore);
  protected readonly season = inject(SeasonStore);
  readonly #harvests = inject(HarvestStore);

  protected readonly columns = PLANT_COLUMNS;
  protected readonly gridOptions = PLANT_GRID_OPTIONS;
  protected readonly addLink = GARDEN_ADD_LINK;
  protected readonly seasonItems = SEASON_FILTER_ITEMS;

  protected readonly selectedId = signal<string | null>(null);

  protected readonly showYearSelector = computed(() => this.#harvests.availableYears().length >= 2);
  protected readonly yearOptions = computed(() => buildYearOptions(this.#harvests.availableYears()));
  protected readonly yearValue = computed(() => yearFilterToValue(this.#harvests.effectiveYear()));

  protected onSeasonChange(value: string | null): void {
    if (value !== null && isSeasonFilter(value)) {
      this.season.setSeason(value);
    }
  }

  protected onYearChange(value: string | string[] | null): void {
    if (typeof value !== 'string') {
      return;
    }
    const parsed = parseYearValue(value);
    if (parsed !== null) {
      this.season.setYear(parsed);
    }
  }

  protected onRowSelected(event: RowSelectedEvent<PlantRow>): void {
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
