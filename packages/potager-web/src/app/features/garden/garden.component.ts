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
  CardComponent,
  DividerComponent,
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
} from '@justin-croyable/design-system';
import { GARDEN_ROLE, type GardenRole, type ShareableRole } from '@justin-croyable/api-contract';
import { NgIcon } from '@ng-icons/core';

import {
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
import { CatalogStore } from '../../core/catalog-store';
import { GardenPlanStore } from './garden-plan-store';
import { GARDEN_ADD_LINK } from '../../app.routes';

import {
  availableBedSizes,
  type BedSize,
  bedSizeLabel,
} from './scene/garden-plan.model';
import { type GardenCell, type GardenSlot } from './scene/garden-layout';
import { GardenViewComponent } from './scene/garden-view.component';

const NUMBER_FORMATTER = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const EUR_FORMATTER = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
const PLANT_COUNT_PREFIX = '×';

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

type PlotItem = {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly plants: string;
  readonly savings: string;
};

type BedContent = {
  readonly varietyId: string;
  readonly label: string;
  readonly count: string;
};

type BedDetail = {
  readonly label: string;
  readonly fill: string;
  readonly contents: readonly BedContent[];
};

type BedSizeOption = {
  readonly key: string;
  readonly label: string;
  readonly size: BedSize;
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
    CardComponent,
    DividerComponent,
    SegmentComponent,
    FabButtonComponent,
    FabContainerComponent,
    FabListComponent,
    InputDirective,
    InputGroupComponent,
      GardenViewComponent,
    ...SelectImports,
  ],
  template: `
    <div class="flex flex-col gap-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-col">
          <p class="text-muted-foreground text-sm">
            Posez vos bacs sur le champ, puis choisissez la variété de chaque case.
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
          }
          @if (canWrite()) {
            <a appButton size="sm" class="hidden sm:inline-flex" [routerLink]="addLink">
              <ng-icon name="phosphorPlus" class="size-4" />
              Ajouter
            </a>
          }
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <app-garden-view
          class="block xl:col-span-2"
          [rows]="displayedRows()"
          [(selectedId)]="selectedId"
          (slotPicked)="onSlotPicked($event)"
          (cellPicked)="onCellPicked($event)"
        />

        <div class="flex flex-col gap-4">
          @if (bedDetail(); as detail) {
            <app-card [title]="detail.label" [description]="detail.fill">
              @if (detail.contents.length === 0) {
                <p class="text-muted-foreground text-sm">
                  Touchez une case du bac pour y implanter une variété.
                </p>
              } @else {
                <div class="flex flex-col gap-1">
                  @for (content of detail.contents; track content.varietyId) {
                    <div class="flex items-center justify-between gap-3">
                      <span class="text-foreground min-w-0 flex-1 truncate text-sm">
                        {{ content.label }}
                      </span>
                      <span class="text-muted-foreground shrink-0 text-xs tabular-nums">
                        {{ content.count }}
                      </span>
                    </div>
                  }
                </div>
              }
              @if (canWrite()) {
                <div card-footer class="w-full flex-row justify-end">
                  <button appButton variant="outline" size="sm" (click)="onRemoveBed()">
                    <ng-icon name="phosphorTrash" class="size-4" />
                    Retirer le bac
                  </button>
                </div>
              }
            </app-card>
          } @else {
            <app-card title="Aucun bac sélectionné">
              <p class="text-muted-foreground text-sm">
                Touchez un emplacement libre du champ pour poser un bac, ou un bac existant pour
                voir son contenu.
              </p>
            </app-card>
          }

          @if (hasRows()) {
            <app-card title="Vos variétés" [description]="plotCountLabel()">
              <div class="flex max-h-80 flex-col gap-2 overflow-y-auto">
                @for (plot of plotItems(); track plot.id) {
                  <div class="flex items-center gap-2">
                    <ng-icon [name]="plot.icon" class="text-muted-foreground size-4 shrink-0" />
                    <span class="min-w-0 flex-1 truncate text-sm">{{ plot.label }}</span>
                    <span class="text-muted-foreground shrink-0 text-xs tabular-nums">
                      {{ plot.plants }}
                    </span>
                    <span class="shrink-0 text-xs font-semibold tabular-nums">
                      {{ plot.savings }}
                    </span>
                  </div>
                }
              </div>
            </app-card>
          }
        </div>
      </div>
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
            <button
              appFabButton
              type="button"
              variant="secondary"
              (click)="openFilter()"
              aria-label="Filtrer"
            >
              <ng-icon name="phosphorFunnel" />
            </button>
          }
          @if (canWrite()) {
            <button
              appFabButton
              type="button"
              variant="destructive"
              [fabDisabled]="!selectedId()"
              aria-label="Retirer le bac sélectionné"
              (click)="onRemoveBed()"
            >
              <ng-icon name="phosphorTrash" />
            </button>
          }
          @if (canManage()) {
            <button
              appFabButton
              type="button"
              variant="secondary"
              (click)="openRename()"
              aria-label="Renommer"
            >
              <ng-icon name="phosphorPencilSimple" />
            </button>
            <button
              appFabButton
              type="button"
              variant="secondary"
              (click)="openShare()"
              aria-label="Partager"
            >
              <ng-icon name="phosphorUsersThree" />
            </button>
          }
        </app-fab-list>
      </app-fab>
    }

    <ng-template #bedSizeSheet>
      <div class="flex flex-col gap-4 p-4">
        <p class="text-muted-foreground text-sm">
          Choisissez les dimensions du bac à poser sur cet emplacement.
        </p>
        <div class="grid grid-cols-3 gap-2">
          @for (option of bedSizeOptions(); track option.key) {
            <button
              appButton
              type="button"
              size="sm"
              [variant]="option.key === bedSizeKey() ? 'default' : 'outline'"
              (click)="bedSizeKey.set(option.key)"
            >
              {{ option.label }}
            </button>
          }
        </div>
        @if (bedSizeOptions().length === 0) {
          <p class="text-destructive text-sm">
            Aucun bac ne tient sur cet emplacement : il est trop proche du bord ou d'un bac voisin.
          </p>
        }
      </div>
    </ng-template>

    <ng-template #cellSheet>
      <div class="flex flex-col gap-4 p-4">
        <app-select
          label="Variété"
          prefixIcon="phosphorPlant"
          [value]="cellVarietyId()"
          (valueChange)="onCellVarietyChange($event)"
        >
          @for (option of varietyOptions(); track option.id) {
            <app-select-item [value]="option.id">{{ option.label }}</app-select-item>
          }
        </app-select>
        @if (varietyOptions().length === 0) {
          <p class="text-muted-foreground text-sm">
            Aucune variété au catalogue. Ajoutez-en une depuis l'écran des prix.
          </p>
        }
        @if (pendingCellPlanted()) {
          <button appButton variant="outline" size="sm" class="self-start" (click)="onClearCell()">
            <ng-icon name="phosphorTrash" class="size-4" />
            Vider la case
          </button>
        }
      </div>
    </ng-template>

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
          <app-select label="Rôle" [value]="inviteRole()" (valueChange)="onInviteRoleChange($event)">
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
  protected readonly plan = inject(GardenPlanStore);
  readonly #catalog = inject(CatalogStore);
  readonly #access = inject(GardenAccessStore);
  readonly #harvests = inject(HarvestStore);
  readonly #sheet = inject(SheetService);

  protected readonly canWrite = this.#access.canWriteActive;

  private readonly bedSizeSheetTemplate = viewChild.required<TemplateRef<unknown>>('bedSizeSheet');
  private readonly cellSheetTemplate = viewChild.required<TemplateRef<unknown>>('cellSheet');
  private readonly filterSheetTemplate = viewChild.required<TemplateRef<unknown>>('filterSheet');
  private readonly shareSheetTemplate = viewChild.required<TemplateRef<unknown>>('shareSheet');
  private readonly renameSheetTemplate = viewChild.required<TemplateRef<unknown>>('renameSheet');

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
  protected readonly pendingSlot = signal<GardenSlot | null>(null);
  protected readonly pendingCell = signal<GardenCell | null>(null);
  protected readonly bedSizeKey = signal<string | null>(null);
  protected readonly cellVarietyId = signal<string | null>(null);

  protected readonly varietyOptions = this.#catalog.varietyOptions;

  protected readonly bedSizeOptions = computed<BedSizeOption[]>(() => {
    const slot = this.pendingSlot();
    if (slot === null) {
      return [];
    }
    return availableBedSizes(this.plan.beds(), slot.column, slot.row).map(size => ({
      key: bedSizeLabel(size),
      label: bedSizeLabel(size),
      size,
    }));
  });

  protected readonly pendingCellPlanted = computed(() => this.pendingCell()?.varietyId !== null);

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
  protected readonly showMobileActions = computed(
    () => this.hasRows() || this.canManage() || this.canWrite(),
  );

  protected readonly showYearSelector = computed(() => this.#harvests.availableYears().length >= 2);
  protected readonly yearOptions = computed(() => buildYearOptions(this.#harvests.availableYears()));
  protected readonly yearValue = computed(() => yearFilterToValue(this.#harvests.effectiveYear()));

  protected readonly plotItems = computed<PlotItem[]>(() =>
    this.displayedRows().map(row => ({
      id: row.id,
      label: row.label,
      icon: row.cropIcon,
      plants: `${PLANT_COUNT_PREFIX}${NUMBER_FORMATTER.format(row.quantity)}`,
      savings: EUR_FORMATTER.format(row.netSavingsEur),
    })),
  );

  protected readonly plotCountLabel = computed(() => {
    const count = this.displayedRows().length;
    return count > 1 ? `${count} variétés cultivées` : `${count} variété cultivée`;
  });

  protected readonly bedDetail = computed<BedDetail | null>(() => {
    const bedId = this.selectedId();
    const bed = this.plan.beds().find(candidate => candidate.id === bedId);
    if (!bed) {
      return null;
    }
    const cells = this.plan.cells().filter(cell => cell.bedId === bed.id);
    const labels = this.#catalog.byId();
    const counts = cells.reduce<Map<string, number>>((accumulator, cell) => {
      accumulator.set(cell.varietyId, (accumulator.get(cell.varietyId) ?? 0) + 1);
      return accumulator;
    }, new Map());
    const total = bed.columns * bed.rows;
    return {
      label: `Bac ${bed.columns} × ${bed.rows}`,
      fill: `${cells.length} case${cells.length > 1 ? 's' : ''} plantée${cells.length > 1 ? 's' : ''} sur ${total}`,
      contents: Array.from(counts.entries()).map(([varietyId, count]) => ({
        varietyId,
        label: labels.get(varietyId)?.label ?? varietyId,
        count: `${PLANT_COUNT_PREFIX}${NUMBER_FORMATTER.format(count)}`,
      })),
    };
  });

  protected onSlotPicked(slot: GardenSlot): void {
    this.pendingSlot.set(slot);
    const [first] = availableBedSizes(this.plan.beds(), slot.column, slot.row);
    this.bedSizeKey.set(first ? bedSizeLabel(first) : null);
    this.#sheet.create({
      title: 'Poser un bac',
      side: 'bottom',
      okText: 'Poser',
      cancelText: 'Annuler',
      content: this.bedSizeSheetTemplate(),
      onOk: () => this.#placeBed(),
    });
  }

  protected onCellPicked(cell: GardenCell): void {
    this.pendingCell.set(cell);
    this.cellVarietyId.set(cell.varietyId);
    this.#sheet.create({
      title: cell.varietyId === null ? 'Planter une variété' : 'Changer de variété',
      side: 'bottom',
      okText: 'Valider',
      cancelText: 'Annuler',
      content: this.cellSheetTemplate(),
      onOk: () => this.#assignCell(),
    });
  }

  protected onCellVarietyChange(value: string | string[] | null): void {
    if (typeof value === 'string') {
      this.cellVarietyId.set(value);
    }
  }

  protected onClearCell(): void {
    const cell = this.pendingCell();
    if (cell === null) {
      return;
    }
    this.plan.clearCell(cell.bedId, cell.column, cell.row);
    this.cellVarietyId.set(null);
  }

  protected onRemoveBed(): void {
    const bedId = this.selectedId();
    if (bedId === null) {
      return;
    }
    this.plan.removeBed(bedId);
    this.selectedId.set(null);
  }

  #placeBed(): void {
    const slot = this.pendingSlot();
    const option = this.bedSizeOptions().find(candidate => candidate.key === this.bedSizeKey());
    if (slot === null || !option) {
      return;
    }
    this.plan.addBed(slot.column, slot.row, option.size);
  }

  #assignCell(): void {
    const cell = this.pendingCell();
    const varietyId = this.cellVarietyId();
    if (cell === null || varietyId === null) {
      return;
    }
    this.plan.assignCell(cell.bedId, cell.column, cell.row, varietyId);
  }

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

}
