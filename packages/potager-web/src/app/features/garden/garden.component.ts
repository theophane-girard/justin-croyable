import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  ButtonComponent,
  CardComponent,
  CountUpDirective,
  EmptyComponent,
  FabButtonComponent,
  FabContainerComponent,
  FabListComponent,
  TableComponent,
} from '@justin-croyable/design-system';
import { NgIcon } from '@ng-icons/core';
import type { ColDef, GridOptions, RowSelectedEvent, ValueFormatterParams } from 'ag-grid-community';

import { type PlantRow } from '../../core/potager.model';
import { GardenStore } from '../../core/garden-store';
import { GARDEN_ADD_LINK } from '../../app.routes';

const NUMBER_FORMATTER = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const KG_FORMATTER = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });
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

function formatYieldCell(params: ValueFormatterParams<PlantRow, number>): string {
  return typeof params.value === 'number' ? `${YIELD_FORMATTER.format(params.value)} kg/plant` : '';
}

const PLANT_COLUMNS: ColDef<PlantRow>[] = [
  { field: 'cropLabel', headerName: 'Culture', minWidth: 160, flex: 1 },
  { field: 'categoryLabel', headerName: 'Catégorie', minWidth: 120 },
  {
    field: 'quantity',
    headerName: 'Plants',
    type: 'numericColumn',
    valueFormatter: formatCountCell,
  },
  {
    field: 'harvestedKg',
    headerName: 'Récolté (kg)',
    type: 'numericColumn',
    valueFormatter: formatKgCell,
  },
  {
    field: 'yieldPerPlantKg',
    headerName: 'Rendement / plant',
    type: 'numericColumn',
    minWidth: 170,
    valueFormatter: formatYieldCell,
  },
];

const PLANT_GRID_OPTIONS: GridOptions<PlantRow> = {
  rowSelection: { mode: 'singleRow', checkboxes: false, enableClickSelection: true },
  pagination: true,
  paginationPageSize: 8,
  paginationPageSizeSelector: [8, 16, 32],
};

@Component({
  selector: 'app-garden',
  imports: [
    RouterLink,
    NgIcon,
    ButtonComponent,
    CardComponent,
    CountUpDirective,
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
          <h2 class="text-foreground text-lg font-semibold">Mon jardin</h2>
          <p class="text-muted-foreground text-sm">
            Plants cultivés et rendement estimé par plant.
          </p>
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
                <span class="text-muted-foreground text-sm">Rendement moyen</span>
                <span class="text-primary text-3xl font-bold tabular-nums">
                  <span appCountUp>{{ store.averageYieldPerPlantKg() }}</span> kg/plant
                </span>
              </div>
              <div class="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
                <ng-icon name="phosphorTrendUp" class="size-5" />
              </div>
            </div>
          </app-card>

          <app-card>
            <div class="flex items-center justify-between">
              <div class="flex flex-col gap-1">
                <span class="text-muted-foreground text-sm">Meilleur rendement</span>
                <span class="text-foreground text-2xl font-bold">{{ store.bestYieldCropLabel() }}</span>
              </div>
              <div class="bg-secondary text-secondary-foreground flex size-10 items-center justify-center rounded-lg">
                <ng-icon name="phosphorPlant" class="size-5" />
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

  protected readonly columns = PLANT_COLUMNS;
  protected readonly gridOptions = PLANT_GRID_OPTIONS;
  protected readonly addLink = GARDEN_ADD_LINK;

  protected readonly selectedId = signal<string | null>(null);

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
