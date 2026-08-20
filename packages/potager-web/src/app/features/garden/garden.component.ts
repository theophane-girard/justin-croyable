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
  BadgeComponent,
  ButtonComponent,
  DividerComponent,
  EmptyComponent,
  FabButtonComponent,
  FabContainerComponent,
  FabListComponent,
  injectQueryFilters,
  InputDirective,
  InputGroupComponent,
  SegmentComponent,
  type SegmentItem,
  SelectImports,
  SheetService,
  stringFilter,
  TableComponent,
} from '@justin-croyable/design-system';
import { GARDEN_ROLE, type GardenRole, type ShareableRole } from '@justin-croyable/api-contract';
import { NgIcon } from '@ng-icons/core';
import type { ColDef, GridOptions, RowSelectedEvent, ValueFormatterParams } from 'ag-grid-community';

import {
  cropUnit,
  formatQuantity,
  HARVEST_UNIT_META,
  isSeasonFilter,
  type PlantRow,
  SEASON,
  SEASON_FILTER_ALL,
  SEASON_META,
} from '../../core/potager.model';
import { CULTURE_FILTER_ALL, CULTURE_FILTER_OPTIONS } from '../../core/catalog-filter';
import { buildYearOptions, parseYearValue, yearFilterToValue } from '../../core/period-selector';
import { GardenAccessStore } from '../../core/garden-access-store';
import { GardenStore } from '../../core/garden-store';
import { HarvestStore } from '../../core/harvest-store';
import { SeasonStore } from '../../core/season-store';
import { SharingStore } from '../../core/sharing-store';
import { TagCellComponent } from '../../shared/tag-cell.component';
import { CATEGORY_TAG_COLOR } from '../../shared/table-badges';
import { GARDEN_ADD_LINK } from '../../app.routes';

const NUMBER_FORMATTER = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const EUR_FORMATTER = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
const YIELD_FORMATTER = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatCountCell(params: ValueFormatterParams<PlantRow, number>): string {
  return typeof params.value === 'number' ? NUMBER_FORMATTER.format(params.value) : '';
}

function formatHarvestedCell(params: ValueFormatterParams<PlantRow, number>): string {
  return typeof params.value === 'number' && params.data
    ? formatQuantity(params.value, cropUnit(params.data.cropId))
    : '';
}

function formatEurCell(params: ValueFormatterParams<PlantRow, number>): string {
  return typeof params.value === 'number' ? EUR_FORMATTER.format(params.value) : '';
}

function formatYieldCell(params: ValueFormatterParams<PlantRow, number>): string {
  return typeof params.value === 'number' && params.data
    ? `${YIELD_FORMATTER.format(params.value)} ${HARVEST_UNIT_META[cropUnit(params.data.cropId)].quantitySuffix}/plant`
    : '';
}

const PLANT_COLUMNS: ColDef<PlantRow>[] = [
  {
    field: 'label',
    headerName: 'Variété',
    minWidth: 150,
    flex: 1,
    cellRenderer: TagCellComponent,
    cellRendererParams: { color: 'primary' },
  },
  {
    field: 'categoryLabel',
    headerName: 'Catégorie',
    minWidth: 110,
    cellRenderer: TagCellComponent,
    cellRendererParams: { color: CATEGORY_TAG_COLOR },
  },
  { field: 'quantity', headerName: 'Plants', type: 'numericColumn', valueFormatter: formatCountCell },
  { field: 'harvestedKg', headerName: 'Récolté', type: 'numericColumn', valueFormatter: formatHarvestedCell },
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

const ROLE_LABEL: Readonly<Record<GardenRole, string>> = {
  [GARDEN_ROLE.owner]: 'Propriétaire',
  [GARDEN_ROLE.coOwner]: 'Co-propriétaire',
  [GARDEN_ROLE.tempEditorViewer]: 'Éditeur temporaire',
  [GARDEN_ROLE.tempEditorRevoked]: 'Éditeur (révoqué)',
  [GARDEN_ROLE.viewer]: 'Lecteur',
};

type MemberBadgeType = 'secondary' | 'outline';

type MemberRow = {
  readonly id: string;
  readonly email: string;
  readonly roleLabel: string;
  readonly badgeType: MemberBadgeType;
  readonly removable: boolean;
};

const INVITE_ROLE_OPTIONS: readonly { readonly value: ShareableRole; readonly label: string }[] = [
  { value: GARDEN_ROLE.viewer, label: ROLE_LABEL[GARDEN_ROLE.viewer] },
  { value: GARDEN_ROLE.coOwner, label: ROLE_LABEL[GARDEN_ROLE.coOwner] },
];

@Component({
  selector: 'app-garden',
  imports: [
    RouterLink,
    NgIcon,
    BadgeComponent,
    ButtonComponent,
    DividerComponent,
    SegmentComponent,
    FabButtonComponent,
    FabContainerComponent,
    FabListComponent,
    InputDirective,
    InputGroupComponent,
    TableComponent,
    EmptyComponent,
    ...SelectImports,
  ],
  template: `
    <div class="flex flex-col gap-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-col">
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
            class="order-last w-full sm:order-none sm:w-auto"
            variant="default"
            [items]="seasonItems"
            [value]="season.season()"
            (valueChange)="onSeasonChange($event)"
          />
          @if (canManage()) {
            <button
              appButton
              variant="outline"
              size="sm"
              class="hidden sm:inline-flex"
              (click)="openRename()"
            >
              <ng-icon name="phosphorPencilSimple" class="size-4" />
              Renommer
            </button>
            <button
              appButton
              variant="outline"
              size="sm"
              class="hidden sm:inline-flex"
              (click)="openShare()"
            >
              <ng-icon name="phosphorUsersThree" class="size-4" />
              Partager
            </button>
          }
          @if (hasRows()) {
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
            @if (canWrite()) {
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
          }
          @if (canWrite()) {
            <a appButton size="sm" class="hidden sm:inline-flex" [routerLink]="addLink">
              <ng-icon name="phosphorPlus" class="size-4" />
              Ajouter
            </a>
          }
        </div>
      </div>

      @if (!hasRows()) {
        <app-empty
          icon="phosphorPottedPlant"
          title="Aucun plant"
          description="Ajoutez vos plants pour suivre le rendement de votre potager."
        >
          @if (canWrite()) {
            <a appButton [routerLink]="addLink">
              <ng-icon name="phosphorPlus" class="size-4" />
              Ajouter un plant
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

    @if (showMobileActions()) {
      <app-fab
        class="sm:hidden"
        position="bottom-right"
        triggerIcon="phosphorDotsThreeVertical"
        triggerLabel="Actions sur le jardin"
      >
        <app-fab-list>
          @if (canWrite()) {
            <a appFabButton [routerLink]="addLink" aria-label="Ajouter un plant">
              <ng-icon name="phosphorPlus" />
            </a>
          }
          @if (hasRows()) {
            <button appFabButton type="button" variant="secondary" (click)="openFilter()" aria-label="Filtrer">
              <ng-icon name="phosphorFunnel" />
            </button>
            @if (canWrite()) {
              <button
                appFabButton
                type="button"
                variant="destructive"
                [fabDisabled]="!selectedId()"
                aria-label="Supprimer la sélection"
                (click)="onDelete()"
              >
                <ng-icon name="phosphorTrash" />
              </button>
            }
          }
          @if (canManage()) {
            <button appFabButton type="button" variant="secondary" (click)="openRename()" aria-label="Renommer">
              <ng-icon name="phosphorPencilSimple" />
            </button>
            <button appFabButton type="button" variant="secondary" (click)="openShare()" aria-label="Partager">
              <ng-icon name="phosphorUsersThree" />
            </button>
          }
        </app-fab-list>
      </app-fab>
    }

    <ng-template #filterSheet>
      <div class="flex flex-col gap-4 p-4">
        <app-select
          label="Culture"
          prefixIcon="phosphorPlant"
          [value]="filters.culture()"
          (valueChange)="onCultureChange($event)"
        >
          @for (option of cultureOptions; track option.value) {
            <app-select-item [value]="option.value">{{ option.label }}</app-select-item>
          }
        </app-select>
      </div>
    </ng-template>

    <ng-template #renameSheet>
      <div class="flex flex-col gap-4 p-4">
        <app-input-group label="Nom du jardin" [required]="true">
          <input
            app-input
            type="text"
            placeholder="Ex. Potager de la maison"
            [value]="renameInput()"
            (input)="onRenameInput($event)"
          />
        </app-input-group>
      </div>
    </ng-template>

    <ng-template #shareSheet>
      <div class="flex flex-col gap-4 p-4">
        <div class="flex flex-col gap-3">
          <app-input-group label="Inviter par email">
            <input
              app-input
              type="email"
              inputmode="email"
              autocomplete="email"
              placeholder="ami@exemple.fr"
              [value]="inviteEmail()"
              (input)="onInviteEmailInput($event)"
            />
          </app-input-group>
          <app-select
            label="Rôle"
            [value]="inviteRole()"
            (valueChange)="onInviteRoleChange($event)"
          >
            @for (option of inviteRoleOptions; track option.value) {
              <app-select-item [value]="option.value">{{ option.label }}</app-select-item>
            }
          </app-select>
          @if (inviteError()) {
            <p class="text-destructive text-sm">{{ inviteError() }}</p>
          }
          <button
            appButton
            size="sm"
            class="self-start"
            [buttonDisabled]="!inviteEmail()"
            (click)="onInvite()"
          >
            <ng-icon name="phosphorPaperPlaneTilt" class="size-4" />
            Inviter
          </button>
        </div>

        <app-divider />

        <div class="flex flex-col gap-1">
          <p class="text-sm font-medium">Membres</p>
          @for (member of memberRows(); track member.id) {
            <div class="flex items-center justify-between gap-3 py-2">
              <span class="text-foreground min-w-0 flex-1 truncate text-sm">{{ member.email }}</span>
              <app-badge [type]="member.badgeType">{{ member.roleLabel }}</app-badge>
              @if (member.removable) {
                <button
                  appButton
                  variant="ghost"
                  size="sm"
                  aria-label="Retirer le membre"
                  (click)="onRemoveMember(member.id)"
                >
                  <ng-icon name="phosphorTrash" class="size-4" />
                </button>
              }
            </div>
          }
        </div>
      </div>
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GardenComponent {
  protected readonly store = inject(GardenStore);
  protected readonly season = inject(SeasonStore);
  protected readonly sharing = inject(SharingStore);
  readonly #access = inject(GardenAccessStore);
  readonly #harvests = inject(HarvestStore);
  readonly #sheet = inject(SheetService);

  protected readonly canWrite = this.#access.canWriteActive;

  private readonly filterSheetTemplate = viewChild.required<TemplateRef<unknown>>('filterSheet');
  private readonly shareSheetTemplate = viewChild.required<TemplateRef<unknown>>('shareSheet');
  private readonly renameSheetTemplate = viewChild.required<TemplateRef<unknown>>('renameSheet');

  protected readonly columns = PLANT_COLUMNS;
  protected readonly gridOptions = PLANT_GRID_OPTIONS;
  protected readonly addLink = GARDEN_ADD_LINK;
  protected readonly seasonItems = SEASON_FILTER_ITEMS;
  protected readonly cultureOptions = CULTURE_FILTER_OPTIONS;
  protected readonly inviteRoleOptions = INVITE_ROLE_OPTIONS;
  protected readonly canManage = this.sharing.canManage;

  protected readonly selectedId = signal<string | null>(null);
  protected readonly inviteEmail = signal<string>('');
  protected readonly inviteRole = signal<ShareableRole>(GARDEN_ROLE.viewer);
  protected readonly inviteError = signal<string | null>(null);
  protected readonly renameInput = signal<string>('');

  protected readonly memberRows = computed<MemberRow[]>(() =>
    this.sharing.members().map(member => ({
      id: member.id,
      email: member.email,
      roleLabel: ROLE_LABEL[member.role],
      badgeType: member.role === GARDEN_ROLE.owner ? 'secondary' : 'outline',
      removable: member.role !== GARDEN_ROLE.owner,
    })),
  );
  protected readonly filters = injectQueryFilters({
    culture: stringFilter(CULTURE_FILTER_ALL),
  });

  protected readonly displayedRows = computed<PlantRow[]>(() => {
    const culture = this.filters.culture();
    if (culture === CULTURE_FILTER_ALL) {
      return this.store.rows();
    }
    return this.store.rows().filter(row => row.cropId === culture);
  });

  protected readonly hasRows = computed(() => this.store.rows().length > 0);
  protected readonly showMobileActions = computed(() => this.hasRows() || this.canManage());

  protected readonly showYearSelector = computed(() => this.#harvests.availableYears().length >= 2);
  protected readonly yearOptions = computed(() => buildYearOptions(this.#harvests.availableYears()));
  protected readonly yearValue = computed(() => yearFilterToValue(this.#harvests.effectiveYear()));

  protected onSeasonChange(value: string | null): void {
    if (value !== null && isSeasonFilter(value)) {
      this.season.setSeason(value);
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

  protected openRename(): void {
    this.renameInput.set(this.#access.active()?.name ?? '');
    this.#sheet.create({
      title: 'Renommer le jardin',
      side: 'bottom',
      okText: 'Enregistrer',
      cancelText: 'Annuler',
      content: this.renameSheetTemplate(),
      onOk: () => void this.#saveRename(),
    });
  }

  protected onRenameInput(event: Event): void {
    this.renameInput.set((event.target as HTMLInputElement).value);
  }

  async #saveRename(): Promise<void> {
    const name = this.renameInput().trim();
    if (name === '') {
      return;
    }
    await this.#access.rename(name);
  }

  protected openShare(): void {
    this.inviteError.set(null);
    this.#sheet.create({
      title: 'Partager le jardin',
      side: 'bottom',
      okText: 'Fermer',
      cancelText: null,
      content: this.shareSheetTemplate(),
    });
  }

  protected onInviteEmailInput(event: Event): void {
    this.inviteEmail.set((event.target as HTMLInputElement).value);
  }

  protected onInviteRoleChange(value: string | string[] | null): void {
    if (value === GARDEN_ROLE.viewer || value === GARDEN_ROLE.coOwner) {
      this.inviteRole.set(value);
    }
  }

  protected onInvite(): void {
    const email = this.inviteEmail().trim();
    if (email === '') {
      return;
    }
    this.inviteError.set(null);
    void this.sharing.invite(email, this.inviteRole()).then(succeeded => {
      if (succeeded) {
        this.inviteEmail.set('');
        return;
      }
      this.inviteError.set("L'invitation a échoué. Vérifie l'adresse ou réessaie.");
    });
  }

  protected onRemoveMember(id: string): void {
    void this.sharing.remove(id);
  }

  protected onCultureChange(value: string | string[] | null): void {
    if (typeof value === 'string') {
      this.filters.set('culture', value);
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
