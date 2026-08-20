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
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_META,
  type ExpenseCategoryId,
  type ExpenseRow,
  isExpenseCategoryId,
  SEASON_META,
} from '../../core/potager.model';
import { ExpenseStore } from '../../core/expense-store';
import { GardenAccessStore } from '../../core/garden-access-store';
import { GardenStore } from '../../core/garden-store';
import { TagCellComponent } from '../../shared/tag-cell.component';
import { TagListCellComponent } from '../../shared/tag-list-cell.component';
import { CATEGORY_TAG_COLOR } from '../../shared/table-badges';
import { EXPENSE_ADD_LINK } from '../../app.routes';

type ExpenseTableRow = ExpenseRow & {
  readonly allocationLabels: readonly string[];
  readonly seasonLabel: string;
};

const ALL_PLANTS_LABEL = 'Tous les plants';

const DATE_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});
const EUR_FORMATTER = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });

function formatDateCell(params: ValueFormatterParams<ExpenseTableRow, Date>): string {
  return params.value instanceof Date ? DATE_FORMATTER.format(params.value) : '';
}

function formatEurCell(params: ValueFormatterParams<ExpenseTableRow, number>): string {
  return typeof params.value === 'number' ? EUR_FORMATTER.format(params.value) : '';
}

const EXPENSE_COLUMNS: ColDef<ExpenseTableRow>[] = [
  { field: 'spentOn', headerName: 'Date', minWidth: 140, valueFormatter: formatDateCell },
  { field: 'label', headerName: 'Libellé', minWidth: 170, flex: 1 },
  {
    field: 'categoryLabel',
    headerName: 'Catégorie',
    minWidth: 150,
    cellRenderer: TagCellComponent,
    cellRendererParams: { color: CATEGORY_TAG_COLOR },
  },
  {
    field: 'allocationLabels',
    headerName: 'Affectation',
    minWidth: 200,
    cellRenderer: TagListCellComponent,
    cellRendererParams: { color: 'primary', max: 2 },
  },
  { field: 'seasonLabel', headerName: 'Saison', minWidth: 100 },
  { field: 'amountEur', headerName: 'Montant', type: 'numericColumn', valueFormatter: formatEurCell },
];

const EXPENSE_GRID_OPTIONS: GridOptions<ExpenseTableRow> = {
  rowSelection: { mode: 'singleRow', checkboxes: false, enableClickSelection: true },
  pagination: true,
  paginationPageSize: 8,
  paginationPageSizeSelector: [8, 16, 32],
};

const CATEGORY_ALL = 'all';

const SORT_FIELD = { date: 'spentOn', amount: 'amountEur' } as const;
type SortField = (typeof SORT_FIELD)[keyof typeof SORT_FIELD];

const SORT_DIR = { asc: 'asc', desc: 'desc' } as const;
type SortDir = (typeof SORT_DIR)[keyof typeof SORT_DIR];

const CHIP_ID = { category: 'category', sort: 'sort' } as const;
type ChipId = (typeof CHIP_ID)[keyof typeof CHIP_ID];

const FIELD_LABEL: Readonly<Record<SortField, string>> = {
  [SORT_FIELD.date]: 'Date',
  [SORT_FIELD.amount]: 'Montant',
};

const SORT_FIELD_ITEMS: SegmentItem[] = [
  { value: SORT_FIELD.date, label: 'Date' },
  { value: SORT_FIELD.amount, label: 'Montant' },
];

const SORT_DIR_ITEMS: SegmentItem[] = [
  { value: SORT_DIR.desc, label: 'Décroissant' },
  { value: SORT_DIR.asc, label: 'Croissant' },
];

const BOTTOM_SHEET_SIDE = 'bottom';

@Component({
  selector: 'app-expenses',
  imports: [
    RouterLink,
    NgIcon,
    ButtonComponent,
    ChipComponent,
    SegmentComponent,
    ...SelectImports,
    FabButtonComponent,
    FabContainerComponent,
    FabListComponent,
    TableComponent,
    EmptyComponent,
  ],
  template: `
    <div class="flex flex-col gap-4">
      <div class="flex items-center justify-between gap-2">
        <div class="flex flex-col">
          <h2 class="text-foreground text-lg font-semibold">Dépenses</h2>
          <p class="text-muted-foreground text-sm">
            Achats du potager, affectés aux plants et déduits de vos économies.
          </p>
        </div>
        <div class="hidden items-center gap-2 sm:flex">
          @if (store.rows().length > 0 && canWrite()) {
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
          @if (canWrite()) {
            <a appButton size="sm" [routerLink]="addLink">
              <ng-icon name="phosphorPlus" class="size-4" />
              Ajouter
            </a>
          }
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
          icon="phosphorReceipt"
          title="Aucune dépense"
          description="Ajoutez une dépense pour l'imputer sur vos économies."
        >
          @if (canWrite()) {
            <a appButton [routerLink]="addLink">
              <ng-icon name="phosphorPlus" class="size-4" />
              Ajouter une dépense
            </a>
          }
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
        triggerLabel="Actions sur les dépenses"
      >
        <app-fab-list>
          @if (canWrite()) {
            <a appFabButton [routerLink]="addLink" aria-label="Ajouter une dépense">
              <ng-icon name="phosphorPlus" />
            </a>
          }
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
      <div class="flex flex-col gap-3 p-4">
        <app-select
          label="Catégorie"
          placeholder="Toutes les catégories"
          [value]="categoryValue()"
          (valueChange)="onCategoryChange($event)"
        >
          <app-select-item [value]="allValue">Toutes les catégories</app-select-item>
          @for (category of categories; track category.id) {
            <app-select-item [value]="category.id">{{ category.label }}</app-select-item>
          }
        </app-select>
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
export class ExpensesComponent {
  protected readonly store = inject(ExpenseStore);
  readonly #garden = inject(GardenStore);
  readonly #access = inject(GardenAccessStore);
  readonly #sheet = inject(SheetService);

  protected readonly canWrite = this.#access.canWriteActive;

  private readonly filterSheetTemplate = viewChild.required<TemplateRef<unknown>>('filterSheet');
  private readonly sortSheetTemplate = viewChild.required<TemplateRef<unknown>>('sortSheet');

  protected readonly columns = EXPENSE_COLUMNS;
  protected readonly gridOptions = EXPENSE_GRID_OPTIONS;
  protected readonly addLink = EXPENSE_ADD_LINK;
  protected readonly categories = EXPENSE_CATEGORIES;
  protected readonly allValue = CATEGORY_ALL;
  protected readonly sortFieldItems = SORT_FIELD_ITEMS;
  protected readonly sortDirItems = SORT_DIR_ITEMS;

  protected readonly selectedId = signal<string | null>(null);
  protected readonly categoryFilter = signal<ExpenseCategoryId | null>(null);
  protected readonly sortField = signal<SortField>(SORT_FIELD.date);
  protected readonly sortDir = signal<SortDir>(SORT_DIR.desc);

  protected readonly categoryValue = computed(() => this.categoryFilter() ?? CATEGORY_ALL);

  readonly #plantLabelById = computed<Map<string, string>>(
    () => new Map(this.#garden.rows().map(plant => [plant.id, plant.label])),
  );

  protected readonly displayedRows = computed<ExpenseTableRow[]>(() => {
    const category = this.categoryFilter();
    const field = this.sortField();
    const direction = this.sortDir();

    const filtered = category
      ? this.store.rows().filter(row => row.categoryId === category)
      : this.store.rows();

    const multiplier = direction === SORT_DIR.asc ? 1 : -1;
    return [...filtered]
      .sort((a, b) => this.#compareRows(a, b, field) * multiplier)
      .map(row => this.#toTableRow(row));
  });

  protected readonly activeChips = computed<{ id: ChipId; label: string }[]>(() => {
    const chips: { id: ChipId; label: string }[] = [];

    const category = this.categoryFilter();
    if (category) {
      chips.push({
        id: CHIP_ID.category,
        label: `Catégorie : ${EXPENSE_CATEGORY_META[category].label}`,
      });
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

  protected onCategoryChange(value: string | string[] | null): void {
    if (typeof value !== 'string' || value === CATEGORY_ALL) {
      this.categoryFilter.set(null);
      return;
    }
    if (isExpenseCategoryId(value)) {
      this.categoryFilter.set(value);
    }
  }

  protected onSortFieldChange(value: string | null): void {
    if (value === SORT_FIELD.date || value === SORT_FIELD.amount) {
      this.sortField.set(value);
    }
  }

  protected onSortDirChange(value: string | null): void {
    if (value === SORT_DIR.asc || value === SORT_DIR.desc) {
      this.sortDir.set(value);
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

  protected onRowSelected(event: RowSelectedEvent<ExpenseTableRow>): void {
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

  #toTableRow(row: ExpenseRow): ExpenseTableRow {
    return {
      ...row,
      allocationLabels: this.#allocationLabels(row),
      seasonLabel: SEASON_META[row.season].label,
    };
  }

  #allocationLabels(row: ExpenseRow): readonly string[] {
    if (row.plantIds.length === 0) {
      return [ALL_PLANTS_LABEL];
    }
    const labels = this.#plantLabelById();
    const resolved = row.plantIds
      .map(id => labels.get(id))
      .filter((label): label is string => label !== undefined);
    return [...new Set(resolved)];
  }

  #compareRows(a: ExpenseRow, b: ExpenseRow, field: SortField): number {
    if (field === SORT_FIELD.date) {
      return a.spentOn.getTime() - b.spentOn.getTime();
    }
    return a[field] - b[field];
  }
}
