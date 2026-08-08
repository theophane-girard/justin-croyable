import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
  type TemplateRef,
  ViewContainerRef,
  viewChild,
} from '@angular/core';

import {
  ButtonComponent,
  EmptyComponent,
  FabButtonComponent,
  FabContainerComponent,
  FabListComponent,
  SheetService,
  SkeletonComponent,
  ToggleGroupComponent,
  type ToggleGroupItem,
} from '@justin-croyable/design-system';
import { NgIcon } from '@ng-icons/core';

import { type PokemonMove } from '../../core/pokemon-detail';
import { typeLabel, TYPE_SLUGS, typeTileClass } from '../../core/pokemon-type';

const DAMAGE_CLASS_LABEL = new Map<string, string>([
  ['physical', 'Physique'],
  ['special', 'Spéciale'],
  ['status', 'Statut'],
]);

const DAMAGE_CLASS_TAG = new Map<string, string>([
  ['physical', 'bg-orange-500/15 text-orange-700 dark:text-orange-300'],
  ['special', 'bg-sky-500/15 text-sky-700 dark:text-sky-300'],
  ['status', 'bg-slate-500/15 text-slate-700 dark:text-slate-300'],
]);

const TYPE_ITEMS: ToggleGroupItem[] = TYPE_SLUGS.map(slug => ({ value: slug, label: typeLabel(slug) }));

const DAMAGE_ITEMS: ToggleGroupItem[] = [
  { value: 'physical', label: 'Physique' },
  { value: 'special', label: 'Spéciale' },
  { value: 'status', label: 'Statut' },
];

const SORT_FIELD_ITEMS: ToggleGroupItem[] = [
  { value: 'power', label: 'Puissance' },
  { value: 'name', label: 'Nom' },
];

const DIRECTION_ITEMS: ToggleGroupItem[] = [
  { value: 'desc', label: 'Décroissant' },
  { value: 'asc', label: 'Croissant' },
];

interface MoveView {
  readonly key: string;
  readonly name: string;
  readonly type: string;
  readonly typeLabel: string;
  readonly typeClass: string;
  readonly damageClass: string;
  readonly damageLabel: string;
  readonly damageTag: string;
  readonly power: number | null;
  readonly powerLabel: string;
}

function asArray(value: string | string[]): string[] {
  return Array.isArray(value) ? value : [value];
}

function toMoveView(move: PokemonMove): MoveView {
  return {
    key: `${move.name}-${move.type}-${move.damageClass}`,
    name: move.name,
    type: move.type,
    typeLabel: typeLabel(move.type),
    typeClass: typeTileClass(move.type),
    damageClass: move.damageClass,
    damageLabel: DAMAGE_CLASS_LABEL.get(move.damageClass) ?? move.damageClass,
    damageTag: DAMAGE_CLASS_TAG.get(move.damageClass) ?? 'bg-muted text-muted-foreground',
    power: move.power,
    powerLabel: move.power === null ? '—' : `${move.power}`,
  };
}

@Component({
  selector: 'app-pokemon-moves',
  imports: [
    NgIcon,
    ButtonComponent,
    EmptyComponent,
    FabButtonComponent,
    FabContainerComponent,
    FabListComponent,
    SkeletonComponent,
    ToggleGroupComponent,
  ],
  template: `
    @if (loading()) {
      <div class="flex flex-col gap-2">
        @for (row of skeletonRows; track row) {
          <app-skeleton class="h-10 w-full" />
        }
      </div>
    } @else if (moves().length === 0) {
      <app-empty
        icon="phosphorSword"
        title="Aucune attaque"
        description="Les attaques ne sont pas disponibles pour ce Pokémon."
      />
    } @else {
      <div class="flex flex-col gap-2">
        <span class="text-muted-foreground text-sm">{{ visibleMoves().length }} attaque(s)</span>
        <div class="flex max-h-[26rem] flex-col gap-2 overflow-y-auto pr-1">
          @for (move of visibleMoves(); track move.key) {
            <div class="border-border flex items-center gap-2 rounded-lg border p-2">
              <span class="min-w-0 flex-1 truncate text-sm font-medium">{{ move.name }}</span>
              <span [class]="move.typeClass" class="rounded-full px-2 py-0.5 text-xs font-medium">
                {{ move.typeLabel }}
              </span>
              <span [class]="move.damageTag" class="rounded-full px-2 py-0.5 text-xs font-medium">
                {{ move.damageLabel }}
              </span>
              <span class="w-10 shrink-0 text-right text-sm tabular-nums">{{ move.powerLabel }}</span>
            </div>
          }
        </div>
      </div>

      <app-fab triggerIcon="phosphorSliders" triggerLabel="Filtrer et trier les attaques">
        <app-fab-list>
          <button appFabButton type="button" aria-label="Filtrer les attaques" (click)="openFilters()">
            <ng-icon name="phosphorFunnel" class="size-5" />
          </button>
          <button appFabButton type="button" aria-label="Trier les attaques" (click)="openSort()">
            <ng-icon name="phosphorArrowsDownUp" class="size-5" />
          </button>
        </app-fab-list>
      </app-fab>
    }

    <ng-template #filtersSheet>
      <div class="flex flex-col gap-5">
        @for (tick of resetKeys(); track tick) {
          <section class="flex flex-col gap-2">
            <h3 class="text-sm font-semibold">Type</h3>
            <app-toggle-group
              mode="multiple"
              class="flex-wrap justify-start"
              [items]="typeItems"
              [value]="selectedTypes()"
              (valueChange)="onTypesChange($event)"
            />
          </section>
          <section class="flex flex-col gap-2">
            <h3 class="text-sm font-semibold">Catégorie</h3>
            <app-toggle-group
              mode="multiple"
              class="justify-start"
              [items]="damageItems"
              [value]="selectedDamage()"
              (valueChange)="onDamageChange($event)"
            />
          </section>
        }
        <div class="flex items-center justify-between gap-2">
          <span class="text-muted-foreground text-sm">{{ visibleMoves().length }} attaque(s)</span>
          <button appButton type="button" variant="ghost" size="sm" (click)="resetFilters()">
            <ng-icon name="phosphorArrowClockwise" class="size-4" />
            Réinitialiser
          </button>
        </div>
      </div>
    </ng-template>

    <ng-template #sortSheet>
      <div class="flex flex-col gap-5">
        @for (tick of resetKeys(); track tick) {
          <section class="flex flex-col gap-2">
            <h3 class="text-sm font-semibold">Trier par</h3>
            <app-toggle-group
              mode="single"
              class="justify-start"
              [items]="sortFieldItems"
              [value]="sortField()"
              (valueChange)="onSortFieldChange($event)"
            />
          </section>
          <section class="flex flex-col gap-2">
            <h3 class="text-sm font-semibold">Ordre</h3>
            <app-toggle-group
              mode="single"
              class="justify-start"
              [items]="directionItems"
              [value]="sortDirection()"
              (valueChange)="onDirectionChange($event)"
            />
          </section>
        }
        <div class="flex justify-end">
          <button appButton type="button" variant="ghost" size="sm" (click)="resetSort()">
            <ng-icon name="phosphorArrowClockwise" class="size-4" />
            Réinitialiser
          </button>
        </div>
      </div>
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonMovesComponent {
  readonly moves = input.required<readonly PokemonMove[]>();
  readonly loading = input<boolean>(false);

  readonly #sheet = inject(SheetService);
  readonly #viewContainerRef = inject(ViewContainerRef);

  private readonly filtersTemplate = viewChild.required<TemplateRef<unknown>>('filtersSheet');
  private readonly sortTemplate = viewChild.required<TemplateRef<unknown>>('sortSheet');

  protected readonly typeItems = TYPE_ITEMS;
  protected readonly damageItems = DAMAGE_ITEMS;
  protected readonly sortFieldItems = SORT_FIELD_ITEMS;
  protected readonly directionItems = DIRECTION_ITEMS;
  protected readonly skeletonRows = [0, 1, 2, 3, 4, 5];

  readonly #selectedTypes = signal<string[]>([]);
  readonly #selectedDamage = signal<string[]>([]);
  readonly #sortField = signal<string>('power');
  readonly #sortDirection = signal<string>('desc');
  readonly #resetKey = signal(0);

  protected readonly selectedTypes = this.#selectedTypes.asReadonly();
  protected readonly selectedDamage = this.#selectedDamage.asReadonly();
  protected readonly sortField = this.#sortField.asReadonly();
  protected readonly sortDirection = this.#sortDirection.asReadonly();
  protected readonly resetKeys = computed(() => [this.#resetKey()]);

  protected readonly visibleMoves = computed<readonly MoveView[]>(() => {
    const types = new Set(this.#selectedTypes());
    const damage = new Set(this.#selectedDamage());
    const field = this.#sortField();
    const ascending = this.#sortDirection() === 'asc';

    const filtered = this.moves()
      .filter(move => types.size === 0 || types.has(move.type))
      .filter(move => damage.size === 0 || damage.has(move.damageClass));

    const sorted = [...filtered].sort((a, b) => {
      if (field === 'name') {
        return ascending ? a.name.localeCompare(b.name, 'fr') : b.name.localeCompare(a.name, 'fr');
      }
      const powerA = a.power ?? -1;
      const powerB = b.power ?? -1;
      return ascending ? powerA - powerB : powerB - powerA;
    });

    return sorted.map(toMoveView);
  });

  protected openFilters(): void {
    this.#sheet.create({
      content: this.filtersTemplate(),
      side: 'bottom',
      title: 'Filtrer les attaques',
      hideFooter: true,
      maskClosable: true,
      viewContainerRef: this.#viewContainerRef,
      customClasses: 'p-4',
    });
  }

  protected openSort(): void {
    this.#sheet.create({
      content: this.sortTemplate(),
      side: 'bottom',
      title: 'Trier les attaques',
      hideFooter: true,
      maskClosable: true,
      viewContainerRef: this.#viewContainerRef,
      customClasses: 'p-4',
    });
  }

  protected onTypesChange(value: string | string[]): void {
    this.#selectedTypes.set(asArray(value));
  }

  protected onDamageChange(value: string | string[]): void {
    this.#selectedDamage.set(asArray(value));
  }

  protected onSortFieldChange(value: string | string[]): void {
    this.#sortField.set(asArray(value)[0] ?? 'power');
  }

  protected onDirectionChange(value: string | string[]): void {
    this.#sortDirection.set(asArray(value)[0] ?? 'desc');
  }

  protected resetFilters(): void {
    this.#selectedTypes.set([]);
    this.#selectedDamage.set([]);
    this.#resetKey.update(key => key + 1);
  }

  protected resetSort(): void {
    this.#sortField.set('power');
    this.#sortDirection.set('desc');
    this.#resetKey.update(key => key + 1);
  }
}
