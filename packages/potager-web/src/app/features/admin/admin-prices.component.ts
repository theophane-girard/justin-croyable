import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import {
  ButtonComponent,
  CardComponent,
  DatePickerComponent,
  EmptyComponent,
  InputDirective,
  InputGroupComponent,
  SelectImports,
  TableComponent,
} from '@justin-croyable/design-system';
import { NgIcon } from '@ng-icons/core';
import type { ColDef, GridOptions, RowSelectedEvent, ValueFormatterParams } from 'ag-grid-community';

import { CROP_BY_ID, isVarietyId, VARIETIES, VARIETY_BY_ID } from '../../core/potager.model';
import { PriceStore } from '../../core/price-store';
import { UserStore } from '../../core/user-store';
import { TagCellComponent } from '../../shared/tag-cell.component';

type AdminPriceRow = {
  readonly id: string;
  readonly varietyId: string;
  readonly varietyLabel: string;
  readonly conventionalPricePerKg: number;
  readonly bioPricePerKg: number | null;
  readonly source: string;
  readonly effectiveFrom: Date;
};

type VarietyOption = { readonly value: string; readonly label: string };

const EUR_FORMATTER = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
});
const DATE_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const DEFAULT_SOURCE = 'manuel';

const SOURCE_OPTIONS: readonly VarietyOption[] = [
  { value: 'manuel', label: 'Manuel' },
  { value: 'rnm', label: 'RNM' },
  { value: 'reference', label: 'Référence' },
];

const VARIETY_OPTIONS: readonly VarietyOption[] = [...VARIETIES]
  .map(variety => ({
    value: variety.id,
    label: `${CROP_BY_ID[variety.cropId].label} · ${variety.label}`,
  }))
  .sort((a, b) => a.label.localeCompare(b.label, 'fr'));

function formatEurCell(params: ValueFormatterParams<AdminPriceRow, number>): string {
  return typeof params.value === 'number' ? EUR_FORMATTER.format(params.value) : '—';
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
    headerName: 'Prix conv. (€/kg)',
    type: 'numericColumn',
    minWidth: 150,
    valueFormatter: formatEurCell,
  },
  {
    field: 'bioPricePerKg',
    headerName: 'Prix bio (€/kg)',
    type: 'numericColumn',
    minWidth: 140,
    valueFormatter: formatEurCell,
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
    NgIcon,
    ButtonComponent,
    CardComponent,
    DatePickerComponent,
    EmptyComponent,
    InputDirective,
    InputGroupComponent,
    TableComponent,
    ...SelectImports,
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
        </div>

        <app-card>
          <div class="flex flex-col gap-4">
            <div class="flex items-center justify-between gap-2">
              <h3 class="text-foreground text-sm font-semibold">
                {{ isEditing() ? 'Modifier un prix' : 'Ajouter un prix' }}
              </h3>
              @if (isEditing()) {
                <button appButton variant="ghost" size="sm" (click)="onReset()">
                  <ng-icon name="phosphorPlus" class="size-4" />
                  Nouveau
                </button>
              }
            </div>

            <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
              <app-select
                label="Variété"
                placeholder="Sélectionner une variété…"
                [required]="true"
                [value]="varietyId()"
                (valueChange)="onVarietyChange($event)"
              >
                @for (option of varietyOptions; track option.value) {
                  <app-select-item [value]="option.value">{{ option.label }}</app-select-item>
                }
              </app-select>

              <app-select
                label="Source"
                [value]="source()"
                (valueChange)="onSourceChange($event)"
              >
                @for (option of sourceOptions; track option.value) {
                  <app-select-item [value]="option.value">{{ option.label }}</app-select-item>
                }
              </app-select>

              <app-input-group label="Prix conventionnel" hint="En €/kg." [required]="true">
                <input
                  app-input
                  type="number"
                  inputmode="decimal"
                  min="0"
                  step="0.1"
                  placeholder="0"
                  [value]="conventionalInput()"
                  (input)="onConventionalInput($event)"
                />
              </app-input-group>

              <app-input-group label="Prix bio" hint="En €/kg, optionnel.">
                <input
                  app-input
                  type="number"
                  inputmode="decimal"
                  min="0"
                  step="0.1"
                  placeholder="—"
                  [value]="bioInput()"
                  (input)="onBioInput($event)"
                />
              </app-input-group>

              <div class="flex flex-col gap-2">
                <label class="text-sm font-medium">Date effective</label>
                <app-date-picker
                  placeholder="Choisir une date"
                  format="d MMMM yyyy"
                  type="outline"
                  [value]="effectiveFrom()"
                  (valueChange)="effectiveFrom.set($event)"
                />
              </div>
            </div>

            <div class="flex items-center justify-end gap-2">
              <button appButton [buttonDisabled]="!canSubmit()" (click)="onSave()">
                <ng-icon name="phosphorFloppyDisk" class="size-4" />
                {{ isEditing() ? 'Enregistrer les modifications' : 'Ajouter' }}
              </button>
            </div>
          </div>
        </app-card>

        <div class="flex items-center justify-end gap-2">
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
        </div>

        @if (rows().length === 0) {
          <app-empty
            icon="phosphorCoins"
            title="Aucun prix"
            description="Ajoutez un prix ou lancez le seed de la base."
          />
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
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPricesComponent {
  readonly #prices = inject(PriceStore);
  readonly #users = inject(UserStore);

  protected readonly isAdmin = this.#users.isAdmin;

  protected readonly columns = PRICE_COLUMNS;
  protected readonly gridOptions = PRICE_GRID_OPTIONS;
  protected readonly varietyOptions = VARIETY_OPTIONS;
  protected readonly sourceOptions = SOURCE_OPTIONS;

  protected readonly varietyId = signal<string>('');
  protected readonly conventionalInput = signal<string>('');
  protected readonly bioInput = signal<string>('');
  protected readonly source = signal<string>(DEFAULT_SOURCE);
  protected readonly effectiveFrom = signal<Date | null>(new Date());
  protected readonly editingId = signal<string | null>(null);
  protected readonly selectedId = signal<string | null>(null);

  protected readonly isEditing = computed(() => this.editingId() !== null);

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

  readonly #conventional = computed(() => this.#parsePrice(this.conventionalInput()));
  readonly #bio = computed(() => this.#parseOptionalPrice(this.bioInput()));

  protected readonly canSubmit = computed(
    () =>
      isVarietyId(this.varietyId()) &&
      this.#conventional() !== null &&
      this.effectiveFrom() !== null,
  );

  protected onVarietyChange(value: string | string[] | null): void {
    if (typeof value === 'string') {
      this.varietyId.set(value);
    }
  }

  protected onSourceChange(value: string | string[] | null): void {
    if (typeof value === 'string') {
      this.source.set(value);
    }
  }

  protected onConventionalInput(event: Event): void {
    this.conventionalInput.set((event.target as HTMLInputElement).value);
  }

  protected onBioInput(event: Event): void {
    this.bioInput.set((event.target as HTMLInputElement).value);
  }

  protected onSave(): void {
    const conventionalPricePerKg = this.#conventional();
    const effectiveFrom = this.effectiveFrom();
    const varietyId = this.varietyId();
    if (conventionalPricePerKg === null || effectiveFrom === null || !isVarietyId(varietyId)) {
      return;
    }
    const payload = {
      varietyId,
      conventionalPricePerKg,
      bioPricePerKg: this.#bio(),
      effectiveFrom: effectiveFrom.toISOString(),
      source: this.source(),
    };
    const editingId = this.editingId();
    const request = editingId
      ? this.#prices.updatePrice(editingId, payload)
      : this.#prices.createPrice(payload);
    void request.then(succeeded => (succeeded ? this.#resetForm() : undefined));
  }

  protected onReset(): void {
    this.#resetForm();
  }

  protected onRowSelected(event: RowSelectedEvent<AdminPriceRow>): void {
    const row = event.data;
    if (!row) {
      return;
    }
    if (event.node.isSelected()) {
      this.#loadRow(row);
      return;
    }
    if (this.selectedId() === row.id) {
      this.#resetForm();
    }
  }

  protected onDelete(): void {
    const id = this.selectedId();
    if (id === null) {
      return;
    }
    void this.#prices.removePrice(id).then(succeeded => (succeeded ? this.#resetForm() : undefined));
  }

  #loadRow(row: AdminPriceRow): void {
    this.varietyId.set(row.varietyId);
    this.conventionalInput.set(String(row.conventionalPricePerKg));
    this.bioInput.set(row.bioPricePerKg === null ? '' : String(row.bioPricePerKg));
    this.source.set(row.source);
    this.effectiveFrom.set(row.effectiveFrom);
    this.editingId.set(row.id);
    this.selectedId.set(row.id);
  }

  #resetForm(): void {
    this.varietyId.set('');
    this.conventionalInput.set('');
    this.bioInput.set('');
    this.source.set(DEFAULT_SOURCE);
    this.effectiveFrom.set(new Date());
    this.editingId.set(null);
    this.selectedId.set(null);
  }

  #toRow(price: {
    readonly id: string;
    readonly varietyId: string;
    readonly conventionalPricePerKg: number;
    readonly bioPricePerKg: number | null;
    readonly source: string;
    readonly effectiveFrom: string;
  }): AdminPriceRow {
    return {
      id: price.id,
      varietyId: price.varietyId,
      varietyLabel: isVarietyId(price.varietyId)
        ? VARIETY_BY_ID[price.varietyId].label
        : price.varietyId,
      conventionalPricePerKg: price.conventionalPricePerKg,
      bioPricePerKg: price.bioPricePerKg,
      source: price.source,
      effectiveFrom: new Date(price.effectiveFrom),
    };
  }

  #parsePrice(raw: string): number | null {
    const parsed = Number.parseFloat(raw.replace(',', '.'));
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  }

  #parseOptionalPrice(raw: string): number | null {
    return raw.trim() === '' ? null : this.#parsePrice(raw);
  }
}
