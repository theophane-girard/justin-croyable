import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import {
  CardComponent,
  SegmentComponent,
  type SegmentItem,
  SelectImports,
  TableComponent,
} from '@justin-croyable/design-system';
import type { ColDef, GridOptions, ValueFormatterParams } from 'ag-grid-community';

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
  conventionalPriceOrigin,
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
  { field: 'cropLabel', headerName: 'Culture', minWidth: 130, flex: 1 },
  { field: 'varietyLabel', headerName: 'Variété', minWidth: 170, flex: 1 },
  { field: 'categoryLabel', headerName: 'Catégorie', minWidth: 110 },
  {
    field: 'conventionalPricePerKg',
    headerName: 'Prix conventionnel (€/kg)',
    type: 'numericColumn',
    minWidth: 150,
    valueFormatter: formatEurCell,
  },
  {
    field: 'bioPricePerKg',
    headerName: 'Prix bio (€/kg)',
    type: 'numericColumn',
    minWidth: 130,
    valueFormatter: formatEurCell,
  },
  {
    field: 'bioPremiumPct',
    headerName: 'Écart bio',
    type: 'numericColumn',
    minWidth: 110,
    valueFormatter: formatPremiumCell,
  },
  { field: 'sourceLabel', headerName: 'Source du prix', minWidth: 170 },
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
  imports: [CardComponent, SegmentComponent, TableComponent, ...SelectImports],
  template: `
    <div class="flex flex-col gap-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-col">
          <h2 class="text-foreground text-lg font-semibold">Prix moyens</h2>
          <p class="text-muted-foreground text-sm">
            Prix de référence par variété et par culture, prix moyens français (FranceAgriMer — RNM).
          </p>
        </div>
        <div class="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <app-select
            class="w-full sm:w-44"
            prefixIcon="phosphorPlant"
            [value]="cultureFilter()"
            (valueChange)="onCultureChange($event)"
          >
            @for (option of cultureOptions; track option.value) {
              <app-select-item [value]="option.value">{{ option.label }}</app-select-item>
            }
          </app-select>
          <app-select
            class="w-full sm:w-48"
            prefixIcon="phosphorTag"
            [value]="varietyFilter()"
            (valueChange)="onVarietyChange($event)"
          >
            @for (option of varietyOptions(); track option.value) {
              <app-select-item [value]="option.value">{{ option.label }}</app-select-item>
            }
          </app-select>
          <app-segment
            variant="default"
            [items]="categoryItems"
            [value]="categoryValue()"
            (valueChange)="onCategoryChange($event)"
          />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <app-card>
          <div class="flex flex-col gap-1">
            <span class="text-muted-foreground text-sm">Variétés</span>
            <span class="text-foreground text-2xl font-bold tabular-nums">{{ totalCount() }}</span>
          </div>
        </app-card>
        <app-card>
          <div class="flex flex-col gap-1">
            <span class="text-muted-foreground text-sm">Cotées en direct</span>
            <span class="text-primary text-2xl font-bold tabular-nums">{{ liveCount() }}</span>
          </div>
        </app-card>
        <app-card>
          <div class="flex flex-col gap-1">
            <span class="text-muted-foreground text-sm">Via fallback</span>
            <span class="text-foreground text-2xl font-bold tabular-nums">{{ fallbackCount() }}</span>
          </div>
        </app-card>
        <app-card>
          <div class="flex flex-col gap-1">
            <span class="text-muted-foreground text-sm">Date RNM</span>
            <span class="text-foreground text-lg font-semibold">{{ rnmDateLabel() }}</span>
          </div>
        </app-card>
      </div>

      <app-table
        [rowData]="displayedRows()"
        [columnDefs]="columns"
        [gridOptions]="gridOptions"
        height="32rem"
      />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PricesComponent {
  readonly #govPrices = inject(GovPriceService);

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
    const rnmDate = this.#govPrices.priceDate();
    return VARIETIES.map(variety => this.#toRow(variety.id as VarietyId, live, rnmDate)).sort(
      (a, b) => a.cropLabel.localeCompare(b.cropLabel, 'fr'),
    );
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

  protected readonly totalCount = computed(() => this.rows().length);

  protected readonly liveCount = computed(
    () => this.rows().filter(row => row.origin === PRICE_ORIGIN.rnm).length,
  );

  protected readonly fallbackCount = computed(
    () => this.rows().filter(row => row.origin === PRICE_ORIGIN.fallback).length,
  );

  protected readonly rnmDateLabel = computed(() => {
    const date = this.#govPrices.priceDate();
    return date instanceof Date ? DATE_FORMATTER.format(date) : 'Indisponible';
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

  #toRow(varietyId: VarietyId, live: PricePerKgByVariety | null, rnmDate: Date | null): PriceRow {
    const variety = VARIETY_BY_ID[varietyId];
    const crop = CROP_BY_ID[variety.cropId];
    const conventionalPricePerKg = resolveConventionalPrice(varietyId, live);
    const bioPricePerKg = resolveBioPrice(varietyId);
    const origin = conventionalPriceOrigin(varietyId, live);
    const fallbackLabel = VARIETY_BY_ID[cropFallbackVarietyId(variety.cropId)].label;
    return {
      varietyId,
      varietyLabel: variety.label,
      cropId: variety.cropId,
      cropLabel: crop.label,
      categoryLabel: CATEGORY_META[crop.category].label,
      conventionalPricePerKg,
      bioPricePerKg,
      bioPremiumPct: this.#premium(conventionalPricePerKg, bioPricePerKg),
      origin,
      sourceLabel: SOURCE_LABEL[origin](fallbackLabel),
      priceDate: origin === PRICE_ORIGIN.reference ? null : rnmDate,
    };
  }

  #premium(conventional: number, bio: number): number {
    if (conventional <= 0) {
      return 0;
    }
    return Math.round((bio / conventional - 1) * 100);
  }
}
