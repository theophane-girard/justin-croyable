import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';

import {
  ButtonComponent,
  FabButtonComponent,
  SegmentComponent,
  type SegmentItem,
  SelectImports,
  SheetService,
  TableComponent,
} from '@justin-croyable/design-system';
import { NgIcon } from '@ng-icons/core';
import type {
  ColDef,
  GridOptions,
  ICellRendererParams,
  ValueFormatterParams,
} from 'ag-grid-community';

import {
  CATEGORY_META,
  type CategoryId,
  CROP_BY_ID,
  cropFallbackVarietyId,
  PRICE_ORIGIN,
  type PriceOrigin,
  type PricePerKgByVariety,
  type PriceRow,
  VARIETIES,
  VARIETY_BY_ID,
  type VarietyId,
} from '../../core/potager.model';
import {
  priceOrigin,
  resolveBioPrice,
  resolveConventionalPrice,
} from '../../core/reference-prices';
import {
  CULTURE_FILTER_ALL,
  CULTURE_FILTER_OPTIONS,
  VARIETY_FILTER_ALL,
  varietyFilterOptions,
} from '../../core/catalog-filter';
import { GovPriceService } from '../../core/gov-price.service';
import { TagCellComponent } from '../../shared/tag-cell.component';
import { CATEGORY_TAG_COLOR, priceOriginTagColor } from '../../shared/table-badges';

const EUR_FORMATTER = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
});
const PERCENT_FORMATTER = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const DATE_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

function formatEurCell(params: ValueFormatterParams<PriceRow, number>): string {
  return typeof params.value === 'number' ? EUR_FORMATTER.format(params.value) : '';
}

function formatPremiumCell(params: ValueFormatterParams<PriceRow, number>): string {
  return typeof params.value === 'number' ? `+${PERCENT_FORMATTER.format(params.value)} %` : '';
}

function formatDateCell(params: ValueFormatterParams<PriceRow, Date | null>): string {
  return params.value instanceof Date ? DATE_FORMATTER.format(params.value) : '—';
}

const PRICE_COLUMNS: ColDef<PriceRow>[] = [
  {
    field: 'cropLabel',
    headerName: 'Culture',
    minWidth: 130,
    flex: 1,
    cellRenderer: TagCellComponent,
    cellRendererParams: { color: 'primary' },
  },
  {
    field: 'varietyLabel',
    headerName: 'Variété',
    minWidth: 170,
    flex: 1,
    cellRenderer: TagCellComponent,
    cellRendererParams: { color: 'info' },
  },
  {
    field: 'categoryLabel',
    headerName: 'Catégorie',
    minWidth: 110,
    cellRenderer: TagCellComponent,
    cellRendererParams: { color: CATEGORY_TAG_COLOR },
  },
  {
    field: 'conventionalPricePerKg',
    headerName: 'Prix conv. (€/kg)',
    type: 'numericColumn',
    minWidth: 140,
    valueFormatter: formatEurCell,
  },
  {
    field: 'conventionalSourceLabel',
    headerName: 'Source conv.',
    minWidth: 160,
    cellRenderer: TagCellComponent,
    cellRendererParams: {
      color: (params: ICellRendererParams<PriceRow>) =>
        priceOriginTagColor(params.data?.conventionalOrigin),
    },
  },
  {
    field: 'bioPricePerKg',
    headerName: 'Prix bio (€/kg)',
    type: 'numericColumn',
    minWidth: 130,
    valueFormatter: formatEurCell,
  },
  {
    field: 'bioSourceLabel',
    headerName: 'Source bio',
    minWidth: 160,
    cellRenderer: TagCellComponent,
    cellRendererParams: {
      color: (params: ICellRendererParams<PriceRow>) =>
        priceOriginTagColor(params.data?.bioOrigin),
    },
  },
  {
    field: 'bioPremiumPct',
    headerName: 'Écart bio',
    type: 'numericColumn',
    minWidth: 110,
    valueFormatter: formatPremiumCell,
  },
  { field: 'priceDate', headerName: 'Date du prix', minWidth: 140, valueFormatter: formatDateCell },
];

const PRICE_GRID_OPTIONS: GridOptions<PriceRow> = {
  pagination: true,
  paginationPageSize: 12,
  paginationPageSizeSelector: [12, 24, 48],
};

const CATEGORY_ALL = 'all';

const CATEGORY_ITEMS: SegmentItem[] = [
  { value: CATEGORY_ALL, label: 'Toutes' },
  { value: CATEGORY_META.legume.id, label: CATEGORY_META.legume.label },
  { value: CATEGORY_META.fruit.id, label: CATEGORY_META.fruit.label },
];

const SOURCE_LABEL: Readonly<Record<PriceOrigin, (fallbackLabel: string) => string>> = {
  [PRICE_ORIGIN.rnm]: () => 'RNM (direct)',
  [PRICE_ORIGIN.fallback]: fallbackLabel => `RNM · via ${fallbackLabel}`,
  [PRICE_ORIGIN.reference]: () => 'Référence',
};

@Component({
  selector: 'app-prices',
  imports: [
    SegmentComponent,
    TableComponent,
    ButtonComponent,
    FabButtonComponent,
    NgIcon,
    ...SelectImports,
  ],
  template: `
    <div class="flex flex-col gap-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-col">
          <h2 class="text-foreground text-lg font-semibold">Prix moyens</h2>
          <p class="text-muted-foreground text-sm">
            Prix de référence par variété et par culture, prix moyens français (FranceAgriMer — RNM).
          </p>
        </div>
        <button
          appButton
          variant="outline"
          size="sm"
          class="hidden sm:inline-flex"
          (click)="openFilter()"
        >
          <ng-icon name="phosphorFunnel" class="size-4" />
          Filtrer
        </button>
      </div>

      <app-table
        [rowData]="displayedRows()"
        [columnDefs]="columns"
        [gridOptions]="gridOptions"
        height="32rem"
      />
    </div>

    <button
      appFabButton
      variant="secondary"
      position="bottom-right"
      class="sm:hidden"
      aria-label="Filtrer les prix"
      (click)="openFilter()"
    >
      <ng-icon name="phosphorFunnel" />
    </button>

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
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PricesComponent {
  readonly #govPrices = inject(GovPriceService);
  readonly #sheet = inject(SheetService);

  private readonly filterSheetTemplate = viewChild.required<TemplateRef<unknown>>('filterSheet');

  protected readonly columns = PRICE_COLUMNS;
  protected readonly gridOptions = PRICE_GRID_OPTIONS;
  protected readonly categoryItems = CATEGORY_ITEMS;
  protected readonly cultureOptions = CULTURE_FILTER_OPTIONS;

  protected readonly categoryFilter = signal<CategoryId | null>(null);
  protected readonly cultureFilter = signal<string>(CULTURE_FILTER_ALL);
  protected readonly varietyFilter = signal<string>(VARIETY_FILTER_ALL);

  protected readonly categoryValue = computed(() => this.categoryFilter() ?? CATEGORY_ALL);
  protected readonly varietyOptions = computed(() => varietyFilterOptions(this.cultureFilter()));

  protected readonly rows = computed<PriceRow[]>(() => {
    const live = this.#govPrices.livePrices();
    const liveBio = this.#govPrices.liveBioPrices();
    const rnmDate = this.#govPrices.priceDate();
    return VARIETIES.map(variety =>
      this.#toRow(variety.id as VarietyId, live, liveBio, rnmDate),
    ).sort((a, b) => a.cropLabel.localeCompare(b.cropLabel, 'fr'));
  });

  protected readonly displayedRows = computed<PriceRow[]>(() => {
    const category = this.categoryFilter();
    const categoryLabel = category ? CATEGORY_META[category].label : null;
    const culture = this.cultureFilter();
    const variety = this.varietyFilter();
    return this.rows().filter(
      row =>
        (categoryLabel === null || row.categoryLabel === categoryLabel) &&
        (culture === CULTURE_FILTER_ALL || row.cropId === culture) &&
        (variety === VARIETY_FILTER_ALL || row.varietyId === variety),
    );
  });

  protected onCategoryChange(value: string | null): void {
    if (value === CATEGORY_ALL || value === null) {
      this.categoryFilter.set(null);
      return;
    }
    if (value in CATEGORY_META) {
      this.categoryFilter.set(value as CategoryId);
    }
  }

  protected openFilter(): void {
    this.#sheet.create({
      title: 'Filtrer',
      side: 'bottom',
      okText: 'Fermer',
      cancelText: null,
      content: this.filterSheetTemplate(),
    });
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

  #toRow(
    varietyId: VarietyId,
    live: PricePerKgByVariety | null,
    liveBio: PricePerKgByVariety | null,
    rnmDate: Date | null,
  ): PriceRow {
    const variety = VARIETY_BY_ID[varietyId];
    const crop = CROP_BY_ID[variety.cropId];
    const conventionalPricePerKg = resolveConventionalPrice(varietyId, live);
    const bioPricePerKg = resolveBioPrice(varietyId, liveBio);
    const conventionalOrigin = priceOrigin(varietyId, live);
    const bioOrigin = priceOrigin(varietyId, liveBio);
    const fallbackLabel = VARIETY_BY_ID[cropFallbackVarietyId(variety.cropId)].label;
    const isLive =
      conventionalOrigin !== PRICE_ORIGIN.reference || bioOrigin !== PRICE_ORIGIN.reference;
    return {
      varietyId,
      varietyLabel: variety.label,
      cropId: variety.cropId,
      cropLabel: crop.label,
      categoryLabel: CATEGORY_META[crop.category].label,
      conventionalPricePerKg,
      conventionalOrigin,
      conventionalSourceLabel: SOURCE_LABEL[conventionalOrigin](fallbackLabel),
      bioPricePerKg,
      bioOrigin,
      bioSourceLabel: SOURCE_LABEL[bioOrigin](fallbackLabel),
      bioPremiumPct: this.#premium(conventionalPricePerKg, bioPricePerKg),
      priceDate: isLive ? rnmDate : null,
    };
  }

  #premium(conventional: number, bio: number): number {
    if (conventional <= 0) {
      return 0;
    }
    return Math.round((bio / conventional - 1) * 100);
  }
}
