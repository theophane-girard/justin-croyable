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
  InputDirective,
  InputGroupComponent,
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
  RowSelectedEvent,
  ValueFormatterParams,
} from 'ag-grid-community';

import {
  CATEGORY_META,
  type CategoryId,
  CROP_BY_ID,
  type CropId,
  cropUnit,
  HARVEST_UNIT_META,
  PRICE_ORIGIN,
  type PriceOrigin,
  type PriceRow,
  type Variety,
  type VarietyId,
} from '../../core/potager.model';
import {
  CULTURE_FILTER_ALL,
  CULTURE_FILTER_OPTIONS,
  VARIETY_FILTER_ALL,
  varietyFilterOptions,
} from '../../core/catalog-filter';
import { type CatalogOption, CatalogStore } from '../../core/catalog-store';
import { type CurrentPrice, PriceStore } from '../../core/price-store';
import { UserStore } from '../../core/user-store';
import { TagCellComponent } from '../../shared/tag-cell.component';
import { CATEGORY_TAG_COLOR, priceOriginTagColor } from '../../shared/table-badges';

const PRICE_NUMBER_FORMATTER = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const FACTOR_FORMATTER = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });
const PERCENT_FORMATTER = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const DATE_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const NATURE_TEXT: Readonly<Record<PriceOrigin, string>> = {
  [PRICE_ORIGIN.rnm]: 'RNM',
  [PRICE_ORIGIN.manuel]: 'Manuel',
  [PRICE_ORIGIN.estimation]: 'Estimation',
  [PRICE_ORIGIN.fallback]: 'Repli',
  [PRICE_ORIGIN.reference]: 'Référence',
};

function recordOrigin(source: string): PriceOrigin {
  if (source === PRICE_ORIGIN.rnm) {
    return PRICE_ORIGIN.rnm;
  }
  if (source === PRICE_ORIGIN.manuel) {
    return PRICE_ORIGIN.manuel;
  }
  return PRICE_ORIGIN.reference;
}

type PriceHistoryRow = {
  readonly id: string;
  readonly varietyId: VarietyId;
  readonly cropId: CropId;
  readonly cropLabel: string;
  readonly varietyLabel: string;
  readonly categoryLabel: string;
  readonly conventionalPricePerKg: number;
  readonly bioPricePerKg: number | null;
  readonly origin: PriceOrigin;
  readonly sourceLabel: string;
  readonly effectiveFrom: Date;
};

const PRICE_SCOPE = { latest: 'latest', all: 'all' } as const;
type PriceScope = (typeof PRICE_SCOPE)[keyof typeof PRICE_SCOPE];

const SCOPE_ITEMS: SegmentItem[] = [
  { value: PRICE_SCOPE.latest, label: 'Derniers prix' },
  { value: PRICE_SCOPE.all, label: 'Tous les prix' },
];

const CATEGORY_ALL = 'all';

const CATEGORY_ITEMS: SegmentItem[] = [
  { value: CATEGORY_ALL, label: 'Toutes' },
  { value: CATEGORY_META.legume.id, label: CATEGORY_META.legume.label },
  { value: CATEGORY_META.fruit.id, label: CATEGORY_META.fruit.label },
];

const EDIT_MODE = { fallback: 'fallback', estimation: 'estimation', manuel: 'manuel' } as const;
type EditMode = (typeof EDIT_MODE)[keyof typeof EDIT_MODE];

const EDIT_MODE_ITEMS: SegmentItem[] = [
  { value: EDIT_MODE.fallback, label: 'Repli' },
  { value: EDIT_MODE.estimation, label: 'Estimation' },
  { value: EDIT_MODE.manuel, label: 'Prix manuel' },
];

const MANUAL_PRICE_SOURCE = 'manuel';

function formatPriceCell(params: ValueFormatterParams<PriceRow, number>): string {
  return typeof params.value === 'number' && params.data
    ? `${PRICE_NUMBER_FORMATTER.format(params.value)} ${HARVEST_UNIT_META[cropUnit(params.data.cropId)].priceSuffix}`
    : '';
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
    headerName: 'Prix conv.',
    type: 'numericColumn',
    minWidth: 130,
    valueFormatter: formatPriceCell,
  },
  {
    field: 'bioPricePerKg',
    headerName: 'Prix bio',
    type: 'numericColumn',
    minWidth: 120,
    valueFormatter: formatPriceCell,
  },
  {
    field: 'bioPremiumPct',
    headerName: 'Écart bio',
    type: 'numericColumn',
    minWidth: 100,
    valueFormatter: formatPremiumCell,
  },
  {
    field: 'natureLabel',
    headerName: 'Nature',
    minWidth: 190,
    flex: 1,
    cellRenderer: TagCellComponent,
    cellRendererParams: {
      color: (params: ICellRendererParams<PriceRow>) => priceOriginTagColor(params.data?.origin),
    },
  },
  { field: 'priceDate', headerName: 'Date du prix', minWidth: 140, valueFormatter: formatDateCell },
];

const PRICE_GRID_OPTIONS: GridOptions<PriceRow> = {
  rowSelection: { mode: 'singleRow', checkboxes: false, enableClickSelection: true },
  getRowId: params => params.data.varietyId,
  pagination: true,
  paginationPageSize: 12,
  paginationPageSizeSelector: [12, 24, 48],
};

function formatHistoryPriceCell(params: ValueFormatterParams<PriceHistoryRow, number>): string {
  return typeof params.value === 'number' && params.data
    ? `${PRICE_NUMBER_FORMATTER.format(params.value)} ${HARVEST_UNIT_META[cropUnit(params.data.cropId)].priceSuffix}`
    : '—';
}

function formatHistoryDateCell(params: ValueFormatterParams<PriceHistoryRow, Date>): string {
  return params.value instanceof Date ? DATE_FORMATTER.format(params.value) : '—';
}

const HISTORY_COLUMNS: ColDef<PriceHistoryRow>[] = [
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
    headerName: 'Prix conv.',
    type: 'numericColumn',
    minWidth: 130,
    valueFormatter: formatHistoryPriceCell,
  },
  {
    field: 'bioPricePerKg',
    headerName: 'Prix bio',
    type: 'numericColumn',
    minWidth: 120,
    valueFormatter: formatHistoryPriceCell,
  },
  {
    field: 'sourceLabel',
    headerName: 'Source',
    minWidth: 130,
    cellRenderer: TagCellComponent,
    cellRendererParams: {
      color: (params: ICellRendererParams<PriceHistoryRow>) => priceOriginTagColor(params.data?.origin),
    },
  },
  {
    field: 'effectiveFrom',
    headerName: 'Date effective',
    minWidth: 150,
    valueFormatter: formatHistoryDateCell,
  },
];

const HISTORY_GRID_OPTIONS: GridOptions<PriceHistoryRow> = {
  pagination: true,
  paginationPageSize: 12,
  paginationPageSizeSelector: [12, 24, 48],
};

function parsePositive(raw: string): number | null {
  const parsed = Number.parseFloat(raw.replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

@Component({
  selector: 'app-prices',
  imports: [
    SegmentComponent,
    TableComponent,
    ButtonComponent,
    FabButtonComponent,
    InputDirective,
    InputGroupComponent,
    NgIcon,
    ...SelectImports,
  ],
  template: `
    <div class="flex flex-col gap-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-col">
          <h2 class="text-foreground text-lg font-semibold">Prix</h2>
          <p class="text-muted-foreground text-sm">
            Prix de référence par variété, d'après les prix moyens français (FranceAgriMer — RNM).
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          @if (isAdmin()) {
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
            @if (!showHistory()) {
              <button
                appButton
                variant="outline"
                size="sm"
                [buttonDisabled]="!canEditSelection()"
                (click)="openEditor()"
              >
                <ng-icon name="phosphorPencilSimple" class="size-4" />
                Éditer
              </button>
            }
          }
          <button appButton variant="outline" size="sm" (click)="openFilter()">
            <ng-icon name="phosphorFunnel" class="size-4" />
            Filtrer
          </button>
        </div>
      </div>

      @if (refreshError()) {
        <p class="text-destructive text-sm">{{ refreshError() }}</p>
      }

      <app-segment
        class="self-start"
        variant="accent"
        [items]="scopeItems"
        [value]="scope()"
        (valueChange)="onScopeChange($event)"
      />

      @if (showHistory()) {
        <app-table
          [rowData]="displayedHistoryRows()"
          [columnDefs]="historyColumns"
          [gridOptions]="historyGridOptions"
          height="32rem"
        />
      } @else {
        <app-table
          [rowData]="displayedRows()"
          [columnDefs]="columns"
          [gridOptions]="gridOptions"
          (rowSelected)="onRowSelected($event)"
          height="32rem"
        />
      }
    </div>

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

    <ng-template #editSheet>
      <div class="flex flex-col gap-4 p-4">
        <p class="text-muted-foreground text-sm">
          Prix de « {{ editingLabel() }} » — variété non cotée au RNM.
        </p>
        <app-segment
          variant="accent"
          [items]="editModeItems"
          [value]="editMode()"
          (valueChange)="onEditModeChange($event)"
        />

        @if (editMode() !== 'manuel') {
          <app-select
            label="Variété de repli (prix suivi)"
            placeholder="Sélectionner une variété…"
            [value]="editParentId()"
            (valueChange)="onEditParentChange($event)"
          >
            @for (option of parentOptions(); track option.id) {
              <app-select-item [value]="option.id">{{ option.label }}</app-select-item>
            }
          </app-select>
        }

        @if (editMode() === 'estimation') {
          <app-input-group label="Facteur" hint="Prix = variété de repli × facteur.">
            <input
              app-input
              type="number"
              inputmode="decimal"
              min="0"
              step="0.05"
              placeholder="1"
              [value]="editFactorInput()"
              (input)="onEditFactorInput($event)"
            />
          </app-input-group>
        }

        @if (editMode() === 'manuel') {
          <app-input-group label="Prix conventionnel" hint="Prix fixe saisi à la main.">
            <input
              app-input
              type="number"
              inputmode="decimal"
              min="0"
              step="0.1"
              placeholder="0"
              [value]="editConvInput()"
              (input)="onEditConvInput($event)"
            />
          </app-input-group>
          <app-input-group label="Prix bio" hint="Optionnel.">
            <input
              app-input
              type="number"
              inputmode="decimal"
              min="0"
              step="0.1"
              placeholder="—"
              [value]="editBioInput()"
              (input)="onEditBioInput($event)"
            />
          </app-input-group>
        }
      </div>
    </ng-template>

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
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PricesComponent {
  readonly #prices = inject(PriceStore);
  readonly #catalog = inject(CatalogStore);
  readonly #sheet = inject(SheetService);
  readonly #users = inject(UserStore);

  private readonly filterSheetTemplate = viewChild.required<TemplateRef<unknown>>('filterSheet');
  private readonly editSheetTemplate = viewChild.required<TemplateRef<unknown>>('editSheet');

  protected readonly columns = PRICE_COLUMNS;
  protected readonly gridOptions = PRICE_GRID_OPTIONS;
  protected readonly historyColumns = HISTORY_COLUMNS;
  protected readonly historyGridOptions = HISTORY_GRID_OPTIONS;
  protected readonly categoryItems = CATEGORY_ITEMS;
  protected readonly editModeItems = EDIT_MODE_ITEMS;
  protected readonly scopeItems = SCOPE_ITEMS;
  protected readonly cultureOptions = CULTURE_FILTER_OPTIONS;
  protected readonly isAdmin = this.#users.isAdmin;

  protected readonly categoryFilter = signal<CategoryId | null>(null);
  protected readonly cultureFilter = signal<string>(CULTURE_FILTER_ALL);
  protected readonly varietyFilter = signal<string>(VARIETY_FILTER_ALL);
  protected readonly scope = signal<PriceScope>(PRICE_SCOPE.latest);

  protected readonly refreshing = signal(false);
  protected readonly refreshError = signal<string | null>(null);
  protected readonly selectedRow = signal<PriceRow | null>(null);

  protected readonly editingId = signal<string | null>(null);
  protected readonly editMode = signal<EditMode>(EDIT_MODE.fallback);
  protected readonly editParentId = signal<string>('');
  protected readonly editFactorInput = signal<string>('');
  protected readonly editConvInput = signal<string>('');
  protected readonly editBioInput = signal<string>('');

  protected readonly categoryValue = computed(() => this.categoryFilter() ?? CATEGORY_ALL);
  protected readonly showHistory = computed(() => this.scope() === PRICE_SCOPE.all);
  protected readonly varietyOptions = computed(() =>
    varietyFilterOptions(this.cultureFilter(), this.#catalog.varieties()),
  );
  protected readonly canEditSelection = computed(() => this.selectedRow()?.editable ?? false);
  protected readonly editingLabel = computed(
    () => this.#catalog.labelFor(this.editingId() ?? '') ?? '',
  );
  protected readonly parentOptions = computed<readonly CatalogOption[]>(() =>
    this.#catalog.referenceOptions().filter(option => option.id !== this.editingId()),
  );

  protected readonly rows = computed<PriceRow[]>(() =>
    this.#catalog
      .varieties()
      .map(variety => this.#toRow(variety))
      .sort((a, b) => a.cropLabel.localeCompare(b.cropLabel, 'fr')),
  );

  protected readonly historyRows = computed<PriceHistoryRow[]>(() => {
    const byId = this.#catalog.byId();
    return this.#prices
      .prices()
      .map(price => this.#toHistoryRow(price, byId))
      .filter((row): row is PriceHistoryRow => row !== null)
      .sort(
        (a, b) =>
          a.cropLabel.localeCompare(b.cropLabel, 'fr') ||
          a.varietyLabel.localeCompare(b.varietyLabel, 'fr') ||
          b.effectiveFrom.getTime() - a.effectiveFrom.getTime(),
      );
  });

  readonly #matchesFilters = computed(() => {
    const category = this.categoryFilter();
    const categoryLabel = category ? CATEGORY_META[category].label : null;
    const culture = this.cultureFilter();
    const variety = this.varietyFilter();
    return (row: { categoryLabel: string; cropId: string; varietyId: string }): boolean =>
      (categoryLabel === null || row.categoryLabel === categoryLabel) &&
      (culture === CULTURE_FILTER_ALL || row.cropId === culture) &&
      (variety === VARIETY_FILTER_ALL || row.varietyId === variety);
  });

  protected readonly displayedRows = computed<PriceRow[]>(() =>
    this.rows().filter(this.#matchesFilters()),
  );

  protected readonly displayedHistoryRows = computed<PriceHistoryRow[]>(() =>
    this.historyRows().filter(this.#matchesFilters()),
  );

  protected onRowSelected(event: RowSelectedEvent<PriceRow>): void {
    const row = event.data;
    if (!row) {
      return;
    }
    if (event.node.isSelected()) {
      this.selectedRow.set(row);
      return;
    }
    if (this.selectedRow()?.varietyId === row.varietyId) {
      this.selectedRow.set(null);
    }
  }

  protected onRefreshRnm(): void {
    this.refreshError.set(null);
    this.refreshing.set(true);
    void this.#prices
      .refreshFromRnm()
      .then(succeeded => {
        if (!succeeded) {
          this.refreshError.set('Le rafraîchissement RNM a échoué.');
        }
      })
      .finally(() => this.refreshing.set(false));
  }

  protected openEditor(): void {
    const row = this.selectedRow();
    if (!row || !row.editable) {
      return;
    }
    this.#prefillEditor(row);
    this.#sheet.create({
      title: 'Éditer le prix',
      side: 'bottom',
      okText: 'Enregistrer',
      cancelText: 'Annuler',
      content: this.editSheetTemplate(),
      onOk: () => void this.#saveEditor(),
    });
  }

  #prefillEditor(row: PriceRow): void {
    const variety = this.#catalog.byId().get(row.varietyId);
    this.editingId.set(row.varietyId);
    this.editFactorInput.set(variety?.pricingFactor != null ? String(variety.pricingFactor) : '');
    this.editConvInput.set(String(row.conventionalPricePerKg));
    this.editBioInput.set(row.bioPricePerKg > 0 ? String(row.bioPricePerKg) : '');
    if (variety?.referenceVarietyId) {
      this.editParentId.set(variety.referenceVarietyId);
      this.editMode.set(variety.pricingFactor != null ? EDIT_MODE.estimation : EDIT_MODE.fallback);
      return;
    }
    this.editParentId.set('');
    this.editMode.set(EDIT_MODE.manuel);
  }

  async #saveEditor(): Promise<void> {
    const id = this.editingId();
    if (!id) {
      return;
    }
    const mode = this.editMode();
    if (mode === EDIT_MODE.manuel) {
      await this.#saveManual(id);
      return;
    }
    const parentId = this.editParentId();
    if (!this.#catalog.isKnown(parentId)) {
      return;
    }
    const factor = mode === EDIT_MODE.estimation ? parsePositive(this.editFactorInput()) : null;
    if (mode === EDIT_MODE.estimation && factor === null) {
      return;
    }
    await this.#catalog.updatePricingRule(id, parentId, factor);
  }

  async #saveManual(id: string): Promise<void> {
    const conventionalPricePerKg = parsePositive(this.editConvInput());
    if (conventionalPricePerKg === null) {
      return;
    }
    const bioRaw = this.editBioInput().trim();
    const bioPricePerKg = bioRaw === '' ? null : parsePositive(bioRaw);
    await this.#catalog.updatePricingRule(id, null, null);
    await this.#prices.createPrice({
      varietyId: id,
      conventionalPricePerKg,
      bioPricePerKg,
      effectiveFrom: new Date().toISOString(),
      source: MANUAL_PRICE_SOURCE,
    });
  }

  protected onEditModeChange(value: string | null): void {
    if (value === EDIT_MODE.fallback || value === EDIT_MODE.estimation || value === EDIT_MODE.manuel) {
      this.editMode.set(value);
    }
  }

  protected onEditParentChange(value: string | string[] | null): void {
    if (typeof value === 'string') {
      this.editParentId.set(value);
    }
  }

  protected onEditFactorInput(event: Event): void {
    this.editFactorInput.set((event.target as HTMLInputElement).value);
  }

  protected onEditConvInput(event: Event): void {
    this.editConvInput.set((event.target as HTMLInputElement).value);
  }

  protected onEditBioInput(event: Event): void {
    this.editBioInput.set((event.target as HTMLInputElement).value);
  }

  protected onScopeChange(value: string | null): void {
    if (value === PRICE_SCOPE.latest || value === PRICE_SCOPE.all) {
      this.scope.set(value);
    }
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

  #toRow(variety: Variety): PriceRow {
    const crop = CROP_BY_ID[variety.cropId];
    const current = this.#prices.currentFor(variety.id);
    const conventionalPricePerKg = current?.price.conventionalPricePerKg ?? 0;
    const bioPricePerKg = current?.price.bioPricePerKg ?? 0;
    const origin = current?.kind ?? PRICE_ORIGIN.reference;
    return {
      varietyId: variety.id,
      varietyLabel: variety.label,
      cropId: variety.cropId,
      cropLabel: crop.label,
      categoryLabel: CATEGORY_META[crop.category].label,
      conventionalPricePerKg,
      bioPricePerKg,
      bioPremiumPct: this.#premium(conventionalPricePerKg, bioPricePerKg),
      origin,
      natureLabel: this.#natureLabel(current),
      editable: origin !== PRICE_ORIGIN.rnm,
      priceDate: current ? new Date(current.price.effectiveFrom) : null,
    };
  }

  #toHistoryRow(
    price: { id: string; varietyId: string; conventionalPricePerKg: number; bioPricePerKg: number | null; source: string; effectiveFrom: string },
    byId: ReadonlyMap<VarietyId, Variety>,
  ): PriceHistoryRow | null {
    const variety = byId.get(price.varietyId);
    if (!variety) {
      return null;
    }
    const crop = CROP_BY_ID[variety.cropId];
    const origin = recordOrigin(price.source);
    return {
      id: price.id,
      varietyId: price.varietyId,
      cropId: variety.cropId,
      cropLabel: crop.label,
      varietyLabel: variety.label,
      categoryLabel: CATEGORY_META[crop.category].label,
      conventionalPricePerKg: price.conventionalPricePerKg,
      bioPricePerKg: price.bioPricePerKg,
      origin,
      sourceLabel: NATURE_TEXT[origin],
      effectiveFrom: new Date(price.effectiveFrom),
    };
  }

  #natureLabel(current: CurrentPrice | null): string {
    if (!current) {
      return NATURE_TEXT[PRICE_ORIGIN.reference];
    }
    const parentLabel = current.parentVarietyId
      ? this.#catalog.labelFor(current.parentVarietyId) ?? '—'
      : '—';
    if (current.kind === PRICE_ORIGIN.fallback) {
      return `Repli → ${parentLabel}`;
    }
    if (current.kind === PRICE_ORIGIN.estimation) {
      return `Estim. → ${parentLabel} × ${FACTOR_FORMATTER.format(current.factor ?? 1)}`;
    }
    return NATURE_TEXT[current.kind];
  }

  #premium(conventional: number, bio: number): number {
    if (conventional <= 0) {
      return 0;
    }
    return Math.round((bio / conventional - 1) * 100);
  }
}
