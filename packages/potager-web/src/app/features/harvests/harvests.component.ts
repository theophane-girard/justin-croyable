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

import { CROPS, type HarvestRow, isCropId } from '../../core/potager.model';
import { HarvestStore } from '../../core/harvest-store';

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
    ...SelectImports,
    NgIcon,
    CardComponent,
    ButtonComponent,
    InputDirective,
    InputGroupComponent,
    DatePickerComponent,
    TableComponent,
    EmptyComponent,
  ],
  template: `
    <div class="flex flex-col gap-4">
      <app-card
        title="Ajouter une récolte"
        description="Renseignez la culture, le poids récolté et la date."
      >
        <div class="grid grid-cols-1 gap-5 md:grid-cols-3">
          <app-select
            label="Culture"
            placeholder="Sélectionner une culture…"
            [required]="true"
            [value]="cropId()"
            (valueChange)="onCropChange($event)"
          >
            @for (crop of crops; track crop.id) {
              <app-select-item [value]="crop.id">{{ crop.label }}</app-select-item>
            }
          </app-select>

          <app-input-group label="Poids récolté" hint="En kilogrammes." [required]="true">
            <input
              app-input
              type="number"
              inputmode="decimal"
              min="0"
              step="0.1"
              placeholder="0"
              [value]="weightInput()"
              (input)="onWeightInput($event)"
            />
          </app-input-group>

          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium">Date de récolte</label>
            <app-date-picker
              placeholder="Choisir une date"
              format="d MMMM yyyy"
              type="outline"
              [value]="date()"
              (valueChange)="date.set($event)"
            />
          </div>
        </div>

        <div card-footer class="w-full flex-row justify-end gap-2">
          <button appButton [buttonDisabled]="!canSubmit()" (click)="onSubmit()">
            <ng-icon name="phosphorPlus" class="size-4" />
            Ajouter la récolte
          </button>
        </div>
      </app-card>

      <app-card title="Historique des récoltes" description="Économies estimées au prix moyen français.">
        @if (store.rows().length === 0) {
          <app-empty
            icon="phosphorBasket"
            title="Aucune récolte"
            description="Ajoutez une récolte pour la voir apparaître ici."
          />
        } @else {
          <div class="flex flex-col gap-3">
            <div class="flex items-center justify-end">
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
            <app-table
              [rowData]="store.rows()"
              [columnDefs]="columns"
              [gridOptions]="gridOptions"
              (rowSelected)="onRowSelected($event)"
              height="30rem"
            />
          </div>
        }
      </app-card>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HarvestsComponent {
  protected readonly store = inject(HarvestStore);

  protected readonly crops = CROPS;
  protected readonly columns = HARVEST_COLUMNS;
  protected readonly gridOptions = HARVEST_GRID_OPTIONS;

  protected readonly cropId = signal<string>('');
  protected readonly weightInput = signal<string>('');
  protected readonly date = signal<Date | null>(new Date());
  protected readonly selectedId = signal<string | null>(null);

  protected readonly weightKg = computed(() => {
    const parsed = Number.parseFloat(this.weightInput().replace(',', '.'));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  });

  protected readonly canSubmit = computed(
    () => isCropId(this.cropId()) && this.weightKg() !== null && this.date() !== null,
  );

  protected onCropChange(value: string | string[] | null): void {
    if (typeof value !== 'string') {
      return;
    }
    this.cropId.set(value);
  }

  protected onWeightInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.weightInput.set(target.value);
  }

  protected onSubmit(): void {
    const cropId = this.cropId();
    const weightKg = this.weightKg();
    const harvestedOn = this.date();
    if (!isCropId(cropId) || weightKg === null || harvestedOn === null) {
      return;
    }
    this.store.add({ cropId, weightKg, harvestedOn });
    this.#resetForm();
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

  #resetForm(): void {
    this.cropId.set('');
    this.weightInput.set('');
    this.date.set(new Date());
  }
}
