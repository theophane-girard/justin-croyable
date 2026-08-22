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
  InputDirective,
  InputGroupComponent,
  SegmentComponent,
  type SegmentItem,
  SelectImports,
  SheetService,
} from '@justin-croyable/design-system';
import { type SheetRef } from '@justin-croyable/design-system/components/sheet';
import { GARDEN_ROLE, type GardenRole, type ShareableRole } from '@justin-croyable/api-contract';
import { NgIcon } from '@ng-icons/core';

import { isSeasonFilter, SEASON, SEASON_FILTER_ALL, SEASON_META } from '../../core/potager.model';
import { CULTURE_FILTER_OPTIONS } from '../../core/catalog-filter';
import { buildYearOptions, parseYearValue, yearFilterToValue } from '../../core/period-selector';
import { GardenAccessStore } from '../../core/garden-access-store';
import { GardenStore } from '../../core/garden-store';
import { HarvestStore } from '../../core/harvest-store';
import { SeasonStore } from '../../core/season-store';
import { SharingStore } from '../../core/sharing-store';
import { GARDEN_ADD_LINK, GARDEN_SETUP_LINK } from '../../app.routes';

import { CATALOG_TREE_VARIETIES, CATALOG_VARIETIES, varietyLabel } from './plan/garden-catalog';
import { GardenPlanStore } from './plan/garden-plan-store';
import {
  type CellCoordinate,
  type CellTarget,
  formatMetres,
  type Parcel,
  parcelFootprint,
  SOW_MODE,
  SOW_PATTERN,
  type SowMode,
  type SowPattern,
  sowTargets,
} from './plan/parcel.model';
import {
  cellKey,
  EDGE_AXIS,
  type GardenCell,
  type GardenEdge,
  type GardenTree,
} from './scene/garden-layout';
import { type GroundPoint } from './scene/garden-scene.component';
import { GardenViewComponent } from './scene/garden-view.component';

const NUMBER_FORMATTER = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 0,
});
const PLANT_COUNT_PREFIX = '×';

const SEASON_FILTER_ITEMS: SegmentItem[] = [
  { value: SEASON_FILTER_ALL, label: 'Année entière' },
  {
    value: SEASON.summer,
    label: SEASON_META.summer.label,
    icon: SEASON_META.summer.icon,
  },
  {
    value: SEASON.winter,
    label: SEASON_META.winter.label,
    icon: SEASON_META.winter.icon,
  },
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

type ParcelContent = {
  readonly varietyId: string;
  readonly label: string;
  readonly count: string;
};

type ParcelDetail = {
  readonly label: string;
  readonly surface: string;
  readonly contents: readonly ParcelContent[];
};

type SowChoice = {
  readonly key: string;
  readonly mode: SowMode;
  readonly pattern: SowPattern;
  readonly startSown: boolean;
  readonly label: string;
  readonly description: string;
};

const SCOPE_LABEL: Readonly<Record<SowMode, string>> = {
  [SOW_MODE.single]: 'cette case',
  [SOW_MODE.parcel]: 'toute la parcelle',
  [SOW_MODE.row]: 'la ligne',
  [SOW_MODE.column]: 'la colonne',
};

function spreadChoices(scope: SowMode): readonly SowChoice[] {
  return [
    {
      key: `${scope}-toutes`,
      mode: scope,
      pattern: SOW_PATTERN.all,
      startSown: true,
      label: `Semer ${SCOPE_LABEL[scope]}`,
      description: 'Toutes les cases, même celles déjà semées.',
    },
    {
      key: `${scope}-alternee-semee`,
      mode: scope,
      pattern: SOW_PATTERN.everyOther,
      startSown: true,
      label: 'Une case sur deux',
      description: 'En commençant par une case semée.',
    },
    {
      key: `${scope}-alternee-vide`,
      mode: scope,
      pattern: SOW_PATTERN.everyOther,
      startSown: false,
      label: 'Une case sur deux',
      description: 'En commençant par une case vide.',
    },
    {
      key: `${scope}-combler`,
      mode: scope,
      pattern: SOW_PATTERN.gaps,
      startSown: true,
      label: 'Combler',
      description: 'Uniquement les cases encore libres.',
    },
  ];
}

const SINGLE_CHOICE: SowChoice = {
  key: 'case',
  mode: SOW_MODE.single,
  pattern: SOW_PATTERN.all,
  startSown: true,
  label: 'Semer cette case',
  description: 'Une seule case.',
};

function sowChoicesFor(scope: SowMode): readonly SowChoice[] {
  if (scope !== SOW_MODE.single) {
    return spreadChoices(scope);
  }
  const parcelChoices = spreadChoices(SOW_MODE.parcel);
  return [
    SINGLE_CHOICE,
    ...parcelChoices.filter(choice => choice.pattern !== SOW_PATTERN.everyOther),
  ];
}

const CLEAR_LABEL: Readonly<Record<SowMode, string>> = {
  [SOW_MODE.single]: 'Enlever ce plant',
  [SOW_MODE.parcel]: 'Vider la parcelle',
  [SOW_MODE.row]: 'Vider la ligne',
  [SOW_MODE.column]: 'Vider la colonne',
};

type PendingTarget = {
  readonly parcelId: string;
  readonly origin: CellCoordinate;
  readonly scope: SowMode;
  readonly label: string;
};

const DEFAULT_HARVEST_KG = 1;
const CENTIMETRES_PER_METRE = 100;

function toCentimetres(value: number): number {
  return Math.round(value * CENTIMETRES_PER_METRE);
}

type SheetConfig = {
  readonly title: string;
  readonly description?: string;
  readonly okText?: string;
  readonly cancelText?: string;
  readonly hideFooter?: boolean;
  readonly content: TemplateRef<unknown>;
  readonly onOk?: () => void;
};

const INVITE_ROLE_OPTIONS: readonly {
  readonly value: ShareableRole;
  readonly label: string;
}[] = [
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
    <div class="flex h-full min-h-0 flex-col gap-4">
      <div class="flex shrink-0 flex-wrap items-center justify-end gap-3">
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
          @if (canWrite()) {
            <a
              appButton
              variant="outline"
              size="sm"
              class="hidden sm:inline-flex"
              [routerLink]="setupLink"
            >
              <ng-icon name="phosphorRuler" class="size-4" />
              Reconfigurer
            </a>
            <a appButton size="sm" class="hidden sm:inline-flex" [routerLink]="addLink">
              <ng-icon name="phosphorPlus" class="size-4" />
              Ajouter
            </a>
          }
        </div>
      </div>

      @if (!plan.isConfigured()) {
        <app-card
          title="Votre potager n’est pas encore dessiné"
          description="Décrivez vos parcelles et disposez-les sur le terrain pour commencer à semer."
        >
          <div card-footer class="w-full flex-row justify-start">
            <a appButton [routerLink]="setupLink">
              <ng-icon name="phosphorRuler" class="size-4" />
              Créer mon potager
            </a>
          </div>
        </app-card>
      } @else {
        <app-garden-view
          #view
          class="block min-h-0 flex-3"
          [(selectedId)]="selectedId"
          [selectedCellKeys]="selectionKeys()"
          (cellPicked)="onCellPicked($event)"
          (cellLongPressed)="onCellLongPressed($event)"
          (edgePicked)="onEdgePicked($event)"
          (groundPicked)="onGroundPicked($event)"
          (treePicked)="onTreePicked($event)"
        />

        @if (selectionCount() > 0) {
          <app-card
            class="min-h-0 flex-1 overflow-auto pe-20 sm:pe-0"
            [title]="selectionTitle()"
            description="Touchez d’autres cases pour les ajouter ou les retirer."
          >
            <div class="flex flex-wrap gap-2">
              <button appButton type="button" size="sm" (click)="onSowSelection()">
                <ng-icon name="phosphorPlant" class="size-4" />
                Semer
              </button>
              <button
                appButton
                type="button"
                size="sm"
                variant="outline"
                (click)="onUprootSelection()"
              >
                <ng-icon name="phosphorTrash" class="size-4" />
                Vider
              </button>
              <button appButton type="button" size="sm" variant="ghost" (click)="clearSelection()">
                Terminer
              </button>
            </div>
          </app-card>
        } @else if (parcelDetail(); as detail) {
          <app-card
            class="min-h-0 flex-1 overflow-auto pe-20 sm:pe-0"
            [title]="detail.label"
            [description]="detail.surface"
          >
            @if (detail.contents.length === 0) {
              <p class="text-muted-foreground text-sm">
                Touchez une case pour semer, un bord pour toute une ligne ou une colonne.
              </p>
            } @else {
              <div class="flex flex-wrap items-center gap-x-6 gap-y-1">
                @for (content of detail.contents; track content.varietyId) {
                  <div class="flex items-center gap-2">
                    <span class="text-foreground text-sm">{{ content.label }}</span>
                    <span class="text-muted-foreground text-xs tabular-nums">
                      {{ content.count }}
                    </span>
                  </div>
                }
              </div>
            }
          </app-card>
        } @else {
          <app-card
            class="min-h-0 flex-1 overflow-auto pe-20 sm:pe-0"
            title="Votre potager"
            [description]="planSummary()"
          >
            <p class="text-muted-foreground text-sm">
              Touchez une parcelle pour voir ce qui y pousse, une case pour semer.
            </p>
          </app-card>
        }
      }
    </div>

    <div class="fixed right-4 bottom-4 z-40 flex flex-col items-end gap-3">
      @if (plan.isConfigured()) {
        @if (plan.canUndo()) {
          <button
            appFabButton
            type="button"
            variant="secondary"
            aria-label="Annuler la dernière action"
            (click)="onUndo()"
          >
            <ng-icon name="phosphorArrowUUpLeft" />
          </button>
        }
        <button
          appFabButton
          type="button"
          variant="secondary"
          aria-label="Recentrer la caméra"
          (click)="onRecenter()"
        >
          <ng-icon name="phosphorCrosshair" />
        </button>
      }

      @if (showMobileActions()) {
        <app-fab
          class="sm:hidden"
          position="static"
          triggerIcon="phosphorDotsThreeVertical"
          triggerLabel="Actions sur le jardin"
        >
          <app-fab-list>
            @if (canWrite()) {
              <a appFabButton [routerLink]="addLink" aria-label="Ajouter un plant">
                <ng-icon name="phosphorPlus" />
              </a>
            }
            @if (canWrite()) {
              <a
                appFabButton
                variant="secondary"
                [routerLink]="setupLink"
                aria-label="Reconfigurer le potager"
              >
                <ng-icon name="phosphorRuler" />
              </a>
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
    </div>

    <ng-template #sowModeSheet>
      <div class="flex flex-col gap-2 p-4">
        @for (choice of sowChoices(); track choice.key) {
          <button
            appButton
            type="button"
            variant="outline"
            full
            class="h-auto flex-col items-start gap-0.5 py-3 text-left"
            (click)="onSowChoice(choice)"
          >
            <span class="text-sm font-medium">{{ choice.label }}</span>
            <span class="text-muted-foreground text-xs font-normal">{{ choice.description }}</span>
          </button>
        }
        @if (clearable()) {
          <button
            appButton
            type="button"
            variant="outline"
            full
            class="h-auto flex-col items-start gap-0.5 py-3 text-left"
            (click)="onClear()"
          >
            <span class="text-destructive text-sm font-medium">{{ clearLabel() }}</span>
            <span class="text-muted-foreground text-xs font-normal">
              Retire tous les plants de cette étendue.
            </span>
          </button>
        }
      </div>
    </ng-template>

    <ng-template #varietySheet>
      <div class="flex flex-col gap-4 p-4">
        <app-select
          withSearch
          label="Variété"
          prefixIcon="phosphorPlant"
          searchPlaceholder="Rechercher une variété…"
          [value]="cellVarietyId()"
          (valueChange)="onCellVarietyChange($event)"
        >
          @for (option of varietyItems; track option.id) {
            <app-select-item [value]="option.id">{{ option.label }}</app-select-item>
          }
        </app-select>
        <p class="text-muted-foreground text-sm">{{ targetLabel() }}</p>
      </div>
    </ng-template>

    <ng-template #treeSheet>
      <div class="flex flex-col gap-4 p-4">
        <app-select
          withSearch
          label="Espèce"
          prefixIcon="phosphorTree"
          searchPlaceholder="Rechercher un arbre…"
          [value]="treeVarietyId()"
          (valueChange)="onTreeVarietyChange($event)"
        >
          @for (option of treeVarietyItems; track option.id) {
            <app-select-item [value]="option.id">{{ option.label }}</app-select-item>
          }
        </app-select>
        <p class="text-muted-foreground text-sm">
          L’arbre sera planté à l’endroit touché, hors des parcelles.
        </p>
      </div>
    </ng-template>

    <ng-template #treeActionsSheet>
      <div class="flex flex-col gap-2 p-4">
        <button appButton type="button" variant="outline" full (click)="onHarvestRequested()">
          <ng-icon name="phosphorBasket" class="size-4" />
          Récolter
        </button>
        <button appButton type="button" variant="outline" full (click)="onFellTree()">
          <ng-icon name="phosphorTrash" class="size-4" />
          Abattre
        </button>
      </div>
    </ng-template>

    <ng-template #plantSheet>
      <div class="flex flex-col gap-2 p-4">
        <button appButton type="button" variant="outline" full (click)="onHarvestRequested()">
          <ng-icon name="phosphorBasket" class="size-4" />
          Récolter
        </button>
        <button appButton type="button" variant="outline" full (click)="onReplaceRequested()">
          <ng-icon name="phosphorPencilSimple" class="size-4" />
          Modifier la variété
        </button>
        <button appButton type="button" variant="outline" full (click)="onClear()">
          <ng-icon name="phosphorTrash" class="size-4" />
          Enlever ce plant
        </button>
        <button appButton type="button" variant="outline" full (click)="onClearParcel()">
          <ng-icon name="phosphorTrash" class="size-4" />
          Vider la parcelle
        </button>
      </div>
    </ng-template>

    <ng-template #harvestSheet>
      <div class="flex flex-col gap-4 p-4">
        <p class="text-muted-foreground text-sm">{{ targetLabel() }}</p>
        <app-input-group label="Quantité récoltée (kg)">
          <input
            app-input
            type="number"
            step="0.1"
            min="0"
            [value]="harvestQuantity()"
            (valueChange)="onHarvestQuantityChange($event)"
          />
        </app-input-group>
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
              <span class="text-foreground min-w-0 flex-1 truncate text-sm">{{
                member.email
              }}</span>
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
  host: {
    class: 'block h-full',
  },
})
export class GardenComponent {
  protected readonly store = inject(GardenStore);
  protected readonly season = inject(SeasonStore);
  protected readonly sharing = inject(SharingStore);
  protected readonly plan = inject(GardenPlanStore);
  readonly #access = inject(GardenAccessStore);
  readonly #harvests = inject(HarvestStore);
  readonly #sheet = inject(SheetService);
  readonly #openSheetRef = signal<SheetRef<unknown> | null>(null);

  protected readonly canWrite = this.#access.canWriteActive;

  private readonly view = viewChild<GardenViewComponent>('view');

  private readonly sowModeSheetTemplate = viewChild.required<TemplateRef<unknown>>('sowModeSheet');
  private readonly varietySheetTemplate = viewChild.required<TemplateRef<unknown>>('varietySheet');
  private readonly plantSheetTemplate = viewChild.required<TemplateRef<unknown>>('plantSheet');
  private readonly harvestSheetTemplate = viewChild.required<TemplateRef<unknown>>('harvestSheet');
  private readonly treeSheetTemplate = viewChild.required<TemplateRef<unknown>>('treeSheet');
  private readonly treeActionsSheetTemplate =
    viewChild.required<TemplateRef<unknown>>('treeActionsSheet');
  private readonly shareSheetTemplate = viewChild.required<TemplateRef<unknown>>('shareSheet');
  private readonly renameSheetTemplate = viewChild.required<TemplateRef<unknown>>('renameSheet');

  protected readonly addLink = GARDEN_ADD_LINK;
  protected readonly setupLink = GARDEN_SETUP_LINK;
  protected readonly varietyItems = CATALOG_VARIETIES;
  protected readonly treeVarietyItems = CATALOG_TREE_VARIETIES;
  protected readonly seasonItems = SEASON_FILTER_ITEMS;
  protected readonly cultureOptions = CULTURE_FILTER_OPTIONS;
  protected readonly inviteRoleOptions = INVITE_ROLE_OPTIONS;
  protected readonly canManage = this.sharing.canManage;

  protected readonly selectedId = signal<string | null>(null);
  protected readonly inviteEmail = signal<string>('');
  protected readonly inviteRole = signal<ShareableRole>(GARDEN_ROLE.viewer);
  protected readonly inviteError = signal<string | null>(null);
  protected readonly renameInput = signal<string>('');
  protected readonly pendingTarget = signal<PendingTarget | null>(null);
  protected readonly pendingChoice = signal<SowChoice>(SINGLE_CHOICE);
  protected readonly pendingTree = signal<GardenTree | null>(null);
  protected readonly pendingGround = signal<GroundPoint | null>(null);
  protected readonly cellVarietyId = signal<string | null>(null);
  protected readonly treeVarietyId = signal<string | null>(null);
  protected readonly harvestQuantity = signal<number>(DEFAULT_HARVEST_KG);
  protected readonly selection = signal<readonly CellTarget[]>([]);

  protected readonly selectionKeys = computed(
    () =>
      new Set(this.selection().map(target => cellKey(target.parcelId, target.column, target.row))),
  );

  protected readonly selectionCount = computed(() => this.selection().length);

  protected readonly selectionTitle = computed(() => {
    const count = this.selectionCount();
    return `${count} case${count > 1 ? 's' : ''} sélectionnée${count > 1 ? 's' : ''}`;
  });

  protected readonly sowChoices = computed<readonly SowChoice[]>(() => {
    const target = this.pendingTarget();
    return target === null ? [] : sowChoicesFor(target.scope);
  });

  protected readonly targetLabel = computed(() => {
    const tree = this.pendingTree();
    if (tree !== null) {
      return tree.label;
    }
    const target = this.pendingTarget();
    if (target === null) {
      return '';
    }
    return `${this.#parcelOf(target.parcelId)?.name ?? ''} · ${target.label}`;
  });

  protected readonly clearLabel = computed(() => {
    const target = this.pendingTarget();
    return target === null ? '' : CLEAR_LABEL[target.scope];
  });

  protected readonly clearable = computed(() => {
    const target = this.pendingTarget();
    return target !== null && this.#occupied(target, target.scope);
  });

  protected readonly planSummary = computed(() => {
    const varieties = this.plan.varietyCount();
    const plural = varieties > 1 ? 's' : '';
    return `${varieties} variété${plural} cultivée${plural}`;
  });

  protected readonly memberRows = computed<MemberRow[]>(() =>
    this.sharing.members().map(member => ({
      id: member.id,
      email: member.email,
      roleLabel: ROLE_LABEL[member.role],
      badgeType: member.role === GARDEN_ROLE.owner ? 'secondary' : 'outline',
      removable: member.role !== GARDEN_ROLE.owner,
    })),
  );
  protected readonly showMobileActions = computed(() => this.canManage() || this.canWrite());

  protected readonly showYearSelector = computed(() => this.#harvests.availableYears().length >= 2);
  protected readonly yearOptions = computed(() =>
    buildYearOptions(this.#harvests.availableYears()),
  );
  protected readonly yearValue = computed(() => yearFilterToValue(this.#harvests.effectiveYear()));

  protected readonly parcelDetail = computed<ParcelDetail | null>(() => {
    const parcel = this.#parcelOf(this.selectedId());
    if (!parcel) {
      return null;
    }
    const placement = this.plan.placements().find(candidate => candidate.parcelId === parcel.id);
    const footprint = parcelFootprint(parcel, placement?.rotated ?? false);
    const plantings = this.plan.plantings().filter(planting => planting.parcelId === parcel.id);
    const counts = plantings.reduce<Map<string, number>>((accumulator, planting) => {
      accumulator.set(planting.varietyId, (accumulator.get(planting.varietyId) ?? 0) + 1);
      return accumulator;
    }, new Map());
    return {
      label: parcel.name,
      surface: `${formatMetres(footprint.widthCm)} × ${formatMetres(footprint.depthCm)}`,
      contents: Array.from(counts.entries()).map(([varietyId, count]) => ({
        varietyId,
        label: varietyLabel(varietyId),
        count: `${PLANT_COUNT_PREFIX}${NUMBER_FORMATTER.format(count)}`,
      })),
    };
  });

  protected onCellPicked(cell: GardenCell): void {
    if (!this.canWrite()) {
      return;
    }
    if (this.selectionCount() > 0) {
      this.#toggleSelection(cell);
      return;
    }
    this.pendingTree.set(null);
    this.selectedId.set(cell.parcelId);
    this.pendingTarget.set({
      parcelId: cell.parcelId,
      origin: { column: cell.column, row: cell.row },
      scope: SOW_MODE.single,
      label: `Case ligne ${cell.row + 1}, colonne ${cell.column + 1}`,
    });

    if (cell.varietyId === null) {
      this.#openSowModeSheet();
      return;
    }
    this.cellVarietyId.set(cell.varietyId);
    this.#openSheet({
      title: cell.label,
      description: 'Que voulez-vous faire de ce plant ?',
      hideFooter: true,
      content: this.plantSheetTemplate(),
    });
  }

  protected onCellLongPressed(cell: GardenCell): void {
    if (!this.canWrite()) {
      return;
    }
    this.#closeSheet();
    this.selectedId.set(cell.parcelId);
    this.#toggleSelection(cell);
  }

  protected clearSelection(): void {
    this.selection.set([]);
  }

  protected onSowSelection(): void {
    this.pendingTree.set(null);
    this.cellVarietyId.set(null);
    this.#openSheet({
      title: this.selectionTitle(),
      okText: 'Semer',
      cancelText: 'Annuler',
      content: this.varietySheetTemplate(),
      onOk: () => this.#sowSelection(),
    });
  }

  protected onUprootSelection(): void {
    this.plan.uprootCells(this.selection());
    this.clearSelection();
  }

  protected onGroundPicked(point: GroundPoint): void {
    if (!this.canWrite() || this.selectionCount() > 0) {
      return;
    }
    this.selectedId.set(null);
    this.pendingTree.set(null);
    this.pendingGround.set(point);
    this.treeVarietyId.set(null);
    this.#openSheet({
      title: 'Planter un arbre',
      okText: 'Planter',
      cancelText: 'Annuler',
      content: this.treeSheetTemplate(),
      onOk: () => this.#plantTree(),
    });
  }

  protected onTreePicked(tree: GardenTree): void {
    if (!this.canWrite()) {
      return;
    }
    this.pendingTarget.set(null);
    this.pendingTree.set(tree);
    this.#openSheet({
      title: tree.label,
      description: 'Que voulez-vous faire de cet arbre ?',
      hideFooter: true,
      content: this.treeActionsSheetTemplate(),
    });
  }

  protected onFellTree(): void {
    const tree = this.pendingTree();
    this.#closeSheet();
    if (tree === null) {
      return;
    }
    this.plan.fellTree(tree.id);
    this.pendingTree.set(null);
  }

  protected onTreeVarietyChange(value: string | string[] | null): void {
    if (typeof value === 'string') {
      this.treeVarietyId.set(value);
    }
  }

  protected onEdgePicked(edge: GardenEdge): void {
    if (!this.canWrite() || this.selectionCount() > 0) {
      return;
    }
    this.pendingTree.set(null);
    const row = edge.axis === EDGE_AXIS.row;
    this.selectedId.set(edge.parcelId);
    this.pendingTarget.set({
      parcelId: edge.parcelId,
      origin: {
        column: row ? 0 : edge.index,
        row: row ? edge.index : 0,
      },
      scope: row ? SOW_MODE.row : SOW_MODE.column,
      label: `${row ? 'Ligne' : 'Colonne'} ${edge.index + 1}`,
    });
    this.#openSowModeSheet();
  }

  protected onSowChoice(choice: SowChoice): void {
    this.pendingChoice.set(choice);
    this.cellVarietyId.set(null);
    this.#closeSheet();
    this.#openSheet({
      title: 'Choisir une variété',
      okText: 'Semer',
      cancelText: 'Annuler',
      content: this.varietySheetTemplate(),
      onOk: () => this.#sow(),
    });
  }

  protected onReplaceRequested(): void {
    this.pendingChoice.set(SINGLE_CHOICE);
    this.#closeSheet();
    this.#openSheet({
      title: 'Changer de variété',
      okText: 'Remplacer',
      cancelText: 'Annuler',
      content: this.varietySheetTemplate(),
      onOk: () => this.#replaceVariety(),
    });
  }

  protected onHarvestRequested(): void {
    this.harvestQuantity.set(DEFAULT_HARVEST_KG);
    this.#closeSheet();
    this.#openSheet({
      title: 'Récolter',
      okText: 'Enregistrer',
      cancelText: 'Annuler',
      content: this.harvestSheetTemplate(),
      onOk: () => this.#harvest(),
    });
  }

  protected onClear(): void {
    const target = this.pendingTarget();
    this.#closeSheet();
    if (target === null) {
      return;
    }
    this.plan.uproot(target.parcelId, target.origin, target.scope);
  }

  protected onClearParcel(): void {
    const target = this.pendingTarget();
    this.#closeSheet();
    if (target === null) {
      return;
    }
    this.plan.uproot(target.parcelId, target.origin, SOW_MODE.parcel);
  }

  protected onUndo(): void {
    this.plan.undo();
  }

  protected onRecenter(): void {
    this.view()?.recenter();
  }

  protected onCellVarietyChange(value: string | string[] | null): void {
    if (typeof value === 'string') {
      this.cellVarietyId.set(value);
    }
  }

  protected onHarvestQuantityChange(value: string | number | null | undefined): void {
    const parsed = Number(value);
    this.harvestQuantity.set(Number.isFinite(parsed) ? parsed : 0);
  }

  #openSowModeSheet(): void {
    const target = this.pendingTarget();
    this.#openSheet({
      title: target?.label ?? 'Semer',
      description: 'Sur quelle étendue voulez-vous agir ?',
      hideFooter: true,
      content: this.sowModeSheetTemplate(),
    });
  }

  #occupied(target: PendingTarget, mode: SowMode): boolean {
    const parcel = this.#parcelOf(target.parcelId);
    const placement = this.plan
      .placements()
      .find(candidate => candidate.parcelId === target.parcelId);
    if (!parcel || !placement) {
      return false;
    }
    const footprint = parcelFootprint(parcel, placement.rotated);
    const keys = new Set(
      sowTargets(footprint, mode, target.origin).map(cell => `${cell.column}:${cell.row}`),
    );
    return this.plan
      .plantings()
      .some(
        planting =>
          planting.parcelId === target.parcelId && keys.has(`${planting.column}:${planting.row}`),
      );
  }

  #sow(): void {
    const target = this.pendingTarget();
    const varietyId = this.cellVarietyId();
    if (target === null || varietyId === null) {
      return;
    }
    const choice = this.pendingChoice();
    this.plan.sow(target.parcelId, target.origin, choice.mode, varietyId, {
      pattern: choice.pattern,
      startSown: choice.startSown,
    });
  }

  #sowSelection(): void {
    const varietyId = this.cellVarietyId();
    if (varietyId === null) {
      return;
    }
    this.plan.sowCells(this.selection(), varietyId);
    this.clearSelection();
  }

  #plantTree(): void {
    const point = this.pendingGround();
    const varietyId = this.treeVarietyId();
    if (point === null || varietyId === null) {
      return;
    }
    this.plan.plantTree(varietyId, toCentimetres(point.x), toCentimetres(point.z));
    this.pendingGround.set(null);
  }

  #toggleSelection(cell: GardenCell): void {
    const key = cellKey(cell.parcelId, cell.column, cell.row);
    const current = this.selection();
    const without = current.filter(
      target => cellKey(target.parcelId, target.column, target.row) !== key,
    );
    if (without.length !== current.length) {
      this.selection.set(without);
      return;
    }
    this.selection.set([
      ...current,
      { parcelId: cell.parcelId, column: cell.column, row: cell.row },
    ]);
  }

  #replaceVariety(): void {
    const target = this.pendingTarget();
    const varietyId = this.cellVarietyId();
    if (target === null || varietyId === null) {
      return;
    }
    this.plan.replaceVariety(target.parcelId, target.origin, varietyId);
  }

  #harvest(): void {
    const quantity = this.harvestQuantity();
    if (quantity <= 0) {
      return;
    }
    const tree = this.pendingTree();
    if (tree !== null) {
      this.plan.harvestTree(tree.id, quantity);
      return;
    }
    const target = this.pendingTarget();
    if (target === null) {
      return;
    }
    this.plan.harvest(target.parcelId, target.origin, quantity);
  }

  #openSheet(config: SheetConfig): void {
    this.#openSheetRef.set(this.#sheet.create({ side: 'bottom', ...config }));
  }

  #closeSheet(): void {
    this.#openSheetRef()?.close();
    this.#openSheetRef.set(null);
  }

  #parcelOf(parcelId: string | null): Parcel | null {
    if (parcelId === null) {
      return null;
    }
    return this.plan.parcels().find(parcel => parcel.id === parcelId) ?? null;
  }

  protected onSeasonChange(value: string | null): void {
    if (value !== null && isSeasonFilter(value)) {
      this.season.setSeason(value);
    }
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
