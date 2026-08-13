import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  ButtonComponent,
  ChipComponent,
  EmptyComponent,
  FabButtonComponent,
  FabContainerComponent,
  FabListComponent,
  SegmentComponent,
  type SegmentItem,
  SelectImports,
  SheetService,
  TableComponent,
} from '@justin-croyable/design-system';
import { NgIcon } from '@ng-icons/core';
import type { ColDef, GridOptions, RowSelectedEvent, ValueFormatterParams } from 'ag-grid-community';

import {
  CATEGORY_META,
  type CategoryId,
  cropUnit,
  formatQuantity,
  HARVEST_UNIT_META,
  type HarvestRow,
} from '../../core/potager.model';
import {
  CULTURE_FILTER_ALL,
  CULTURE_FILTER_OPTIONS,
  VARIETY_FILTER_ALL,
  varietyFilterOptions,
} from '../../core/catalog-filter';
import { CatalogStore } from '../../core/catalog-store';
import { HarvestStore } from '../../core/harvest-store';
import { TagCellComponent } from '../../shared/tag-cell.component';
import { CATEGORY_TAG_COLOR } from '../../shared/table-badges';
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

function formatQuantityCell(params: ValueFormatterParams<HarvestRow, number>): string {
  return typeof params.value === 'number' && params.data
    ? formatQuantity(params.value, cropUnit(params.data.cropId))
    : '';
}

function formatPriceCell(params: ValueFormatterParams<HarvestRow, number>): string {
  return typeof params.value === 'number' && params.data
    ? `${KG_FORMATTER.format(params.value)} ${HARVEST_UNIT_META[cropUnit(params.data.cropId)].priceSuffix}`
    : '';
}

function formatEurCell(params: ValueFormatterParams<HarvestRow, number>): string {
  return typeof params.value === 'number' ? EUR_FORMATTER.format(params.value) : '';
}

const HARVEST_COLUMNS: ColDef<HarvestRow>[] = [
  { field: 'harvestedOn', headerName: 'Date', minWidth: 150, valueFormatter: formatDateCell },
  {
    field: 'cropLabel',
    headerName: 'Culture',
    minWidth: 140,
    flex: 1,
    cellRenderer: TagCellComponent,
    cellRendererParams: { color: 'primary' },
  },
  {
    field: 'varietyLabel',
    headerName: 'Variété',
    minWidth: 160,
    flex: 1,
    cellRenderer: TagCellComponent,
    cellRendererParams: { color: 'info' },
  },
  {
    field: 'categoryLabel',
    headerName: 'Catégorie',
    minWidth: 120,
    cellRenderer: TagCellComponent,
    cellRendererParams: { color: CATEGORY_TAG_COLOR },
  },
  { field: 'weightKg', headerName: 'Quantité', type: 'numericColumn', valueFormatter: formatQuantityCell },
  {
    field: 'conventionalPricePerKg',
    headerName: 'Prix conventionnel',
    type: 'numericColumn',
    valueFormatter: formatPriceCell,
  },
  {
    field: 'bioPricePerKg',
    headerName: 'Prix bio',
    type: 'numericColumn',
    valueFormatter: formatPriceCell,
  },
  { field: 'savingsEur', headerName: 'Économie', type: 'numericColumn', valueFormatter: formatEurCell },
];

const HARVEST_GRID_OPTIONS: GridOptions<HarvestRow> = {
  rowSelection: { mode: 'singleRow', checkboxes: false, enableClickSelection: true },
  pagination: true,
  paginationPageSize: 8,
  paginationPageSizeSelector: [8, 16, 32],
};

const CATEGORY_ALL = 'all';

const SORT_FIELD = { date: 'harvestedOn', weight: 'weightKg', savings: 'savingsEur' } as const;
type SortField = (typeof SORT_FIELD)[keyof typeof SORT_FIELD];

const SORT_DIR = { asc: 'asc', desc: 'desc' } as const;
type SortDir = (typeof SORT_DIR)[keyof typeof SORT_DIR];

const CHIP_ID = { category: 'category', sort: 'sort' } as const;
type ChipId = (typeof CHIP_ID)[keyof typeof CHIP_ID];

const FIELD_LABEL: Readonly<Record<SortField, string>> = {
  [SORT_FIELD.date]: 'Date',
  [SORT_FIELD.weight]: 'Quantité',
  [SORT_FIELD.savings]: 'Économie',
};

const CATEGORY_ITEMS: SegmentItem[] = [
  { value: CATEGORY_ALL, label: 'Toutes' },
  { value: CATEGORY_META.legume.id, label: CATEGORY_META.legume.label },
  { value: CATEGORY_META.fruit.id, label: CATEGORY_META.fruit.label },
];

const SORT_FIELD_ITEMS: SegmentItem[] = [
  { value: SORT_FIELD.date, label: 'Date' },
  { value: SORT_FIELD.weight, label: 'Quantité' },
  { value: SORT_FIELD.savings, label: 'Économie' },
];

const SORT_DIR_ITEMS: SegmentItem[] = [
  { value: SORT_DIR.desc, label: 'Décroissant' },
  { value: SORT_DIR.asc, label: 'Croissant' },
];

const BOTTOM_SHEET_SIDE = 'bottom';

@Component({
  selector: 'app-harvests',
  imports: [
    RouterLink,
    NgIcon,
    ButtonComponent,
    ChipComponent,
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
          <button appButton variant="outline" size="sm" (click)="openFilter()">
            <ng-icon name="phosphorFunnel" class="size-4" />
            Filtrer
          </button>
          <button appButton variant="outline" size="sm" (click)="openSort()">
            <ng-icon name="phosphorArrowsDownUp" class="size-4" />
            Trier
          </button>
          <a appButton size="sm" [routerLink]="addLink">
            <ng-icon name="phosphorPlus" class="size-4" />
            Ajouter
          </a>
        </div>
      </div>

      @if (activeChips().length > 0) {
        <div class="flex flex-wrap items-center gap-2">
          @for (chip of activeChips(); track chip.id) {
            <app-chip variant="accent" (removed)="onChipRemoved(chip.id)">{{ chip.label }}</app-chip>
          }
        </div>
      }

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
          [rowData]="displayedRows()"
          [columnDefs]="columns"
          [gridOptions]="gridOptions"
          (rowSelected)="onRowSelected($event)"
          height="30rem"
        />
      }
    </div>

    @if (store.rows().length > 0) {
      <app-fab
        class="sm:hidden"
        position="bottom-right"
        triggerIcon="phosphorDotsThreeVertical"
        triggerLabel="Actions sur les récoltes"
      >
        <app-fab-list>
          <a appFabButton [routerLink]="addLink" aria-label="Ajouter une récolte">
            <ng-icon name="phosphorPlus" />
          </a>
          <button appFabButton type="button" variant="secondary" (click)="openFilter()" aria-label="Filtrer">
            <ng-icon name="phosphorFunnel" />
          </button>
          <button appFabButton type="button" variant="secondary" (click)="openSort()" aria-label="Trier">
            <ng-icon name="phosphorArrowsDownUp" />
          </button>
        </app-fab-list>
      </app-fab>
    }

    <ng-template #filterSheet>
      <div class="flex flex-col gap-4 p-4">
        <app-select
          label="Culture"
          prefixIcon="phosphorPlant"
          [value]="cultureFilter()"
          (valueChange)="onCultureChange($event)"
        >
          @for (option of cultureOptions; track option.value) {
            <app-select-item [value]="option.value">{{ option.label }}</app-select-item>
          }
        </app-select>
        <app-select
          label="Variété"
          prefixIcon="phosphorTag"
          [value]="varietyFilter()"
          (valueChange)="onVarietyChange($event)"
        >
          @for (option of varietyOptions(); track option.value) {
            <app-select-item [value]="option.value">{{ option.label }}</app-select-item>
          }
        </app-select>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium">Catégorie</label>
          <app-segment
            variant="accent"
            [items]="categoryItems"
            [value]="categoryValue()"
            (valueChange)="onCategoryChange($event)"
          />
        </div>
      </div>
    </ng-template>

    <ng-template #sortSheet>
      <div class="flex flex-col gap-5 p-4">
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium">Trier par</label>
          <app-segment
            variant="accent"
            [items]="sortFieldItems"
            [value]="sortField()"
            (valueChange)="onSortFieldChange($event)"
          />
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium">Ordre</label>
          <app-segment
            variant="accent"
            [items]="sortDirItems"
            [value]="sortDir()"
            (valueChange)="onSortDirChange($event)"
          />
        </div>
      </div>
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HarvestsComponent {
  protected readonly store = inject(HarvestStore);
  readonly #catalog = inject(CatalogStore);
  readonly #sheet = inject(SheetService);

  private readonly filterSheetTemplate = viewChild.required<TemplateRef<unknown>>('filterSheet');
  private readonly sortSheetTemplate = viewChild.required<TemplateRef<unknown>>('sortSheet');

  protected readonly columns = HARVEST_COLUMNS;
  protected readonly gridOptions = HARVEST_GRID_OPTIONS;
  protected readonly addLink = HARVEST_ADD_LINK;
  protected readonly categoryItems = CATEGORY_ITEMS;
  protected readonly sortFieldItems = SORT_FIELD_ITEMS;
  protected readonly sortDirItems = SORT_DIR_ITEMS;
  protected readonly cultureOptions = CULTURE_FILTER_OPTIONS;

  protected readonly selectedId = signal<string | null>(null);
  protected readonly categoryFilter = signal<CategoryId | null>(null);
  protected readonly cultureFilter = signal<string>(CULTURE_FILTER_ALL);
  protected readonly varietyFilter = signal<string>(VARIETY_FILTER_ALL);
  protected readonly sortField = signal<SortField>(SORT_FIELD.date);
  protected readonly sortDir = signal<SortDir>(SORT_DIR.desc);

  protected readonly categoryValue = computed(() => this.categoryFilter() ?? CATEGORY_ALL);
  protected readonly varietyOptions = computed(() =>
    varietyFilterOptions(this.cultureFilter(), this.#catalog.varieties()),
  );

  protected readonly displayedRows = computed(() => {
    const category = this.categoryFilter();
    const field = this.sortField();
    const direction = this.sortDir();
    const categoryLabel = category ? CATEGORY_META[category].label : null;
    const culture = this.cultureFilter();
    const variety = this.varietyFilter();

    const filtered = this.store
      .rows()
      .filter(
        row =>
          (categoryLabel === null || row.categoryLabel === categoryLabel) &&
          (culture === CULTURE_FILTER_ALL || row.cropId === culture) &&
          (variety === VARIETY_FILTER_ALL || row.varietyId === variety),
      );

    const multiplier = direction === SORT_DIR.asc ? 1 : -1;
    return [...filtered].sort((a, b) => this.#compareRows(a, b, field) * multiplier);
  });

  protected readonly activeChips = computed<{ id: ChipId; label: string }[]>(() => {
    const chips: { id: ChipId; label: string }[] = [];

    const category = this.categoryFilter();
    if (category) {
      chips.push({ id: CHIP_ID.category, label: `Catégorie : ${CATEGORY_META[category].label}` });
    }

    const field = this.sortField();
    const direction = this.sortDir();
    if (field !== SORT_FIELD.date || direction !== SORT_DIR.desc) {
      const arrow = direction === SORT_DIR.asc ? '↑' : '↓';
      chips.push({ id: CHIP_ID.sort, label: `Tri : ${FIELD_LABEL[field]} ${arrow}` });
    }

    return chips;
  });

  protected openFilter(): void {
    this.#sheet.create({
      title: 'Filtrer',
      side: BOTTOM_SHEET_SIDE,
      okText: 'Fermer',
      cancelText: null,
      content: this.filterSheetTemplate(),
    });
  }

  protected openSort(): void {
    this.#sheet.create({
      title: 'Trier',
      side: BOTTOM_SHEET_SIDE,
      okText: 'Fermer',
      cancelText: null,
      content: this.sortSheetTemplate(),
    });
  }

  protected onCategoryChange(value: string | null): void {
    if (value === CATEGORY_ALL || value === null) {
      this.categoryFilter.set(null);
      return;
    }
    if (value in CATEGORY_META) {
      this.categoryFilter.set(value as CategoryId);
    }
  }

  protected onSortFieldChange(value: string | null): void {
    if (value === SORT_FIELD.date || value === SORT_FIELD.weight || value === SORT_FIELD.savings) {
      this.sortField.set(value);
    }
  }

  protected onSortDirChange(value: string | null): void {
    if (value === SORT_DIR.asc || value === SORT_DIR.desc) {
      this.sortDir.set(value);
    }
  }

  protected onCultureChange(value: string | string[] | null): void {
    if (typeof value !== 'string') {
      return;
    }
    this.cultureFilter.set(value);
    this.varietyFilter.set(VARIETY_FILTER_ALL);
  }

  protected onVarietyChange(value: string | string[] | null): void {
    if (typeof value === 'string') {
      this.varietyFilter.set(value);
    }
  }

  protected onChipRemoved(id: ChipId): void {
    if (id === CHIP_ID.category) {
      this.categoryFilter.set(null);
      return;
    }
    this.sortField.set(SORT_FIELD.date);
    this.sortDir.set(SORT_DIR.desc);
  }

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

  #compareRows(a: HarvestRow, b: HarvestRow, field: SortField): number {
    if (field === SORT_FIELD.date) {
      return a.harvestedOn.getTime() - b.harvestedOn.getTime();
    }
    return a[field] - b[field];
  }
}
