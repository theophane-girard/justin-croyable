import { ScrollingModule } from '@angular/cdk/scrolling';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  output,
  signal,
  type TemplateRef,
  ViewContainerRef,
  viewChild,
} from '@angular/core';

import {
  arrayFilter,
  ButtonComponent,
  EmptyComponent,
  enumFilter,
  FabButtonComponent,
  FabContainerComponent,
  FabListComponent,
  InputDirective,
  injectQueryFilters,
  BadgeComponent,
  SelectImports,
  SheetService,
  stringFilter,
  ToggleGroupComponent,
  type ToggleGroupItem,
} from '@justin-croyable/design-system';
import { NgIcon } from '@ng-icons/core';

import { type Ability } from '../../core/pokemon-ability';
import { searchPokemons } from '../../core/pokemon-search';
import {
  LANG,
  type Pokemon,
  pokemonImageUrl,
  pokemonName,
  pokemonTotal,
  type Stat,
  STAT_META,
  STAT_ORDER,
} from '../../core/pokemon.model';
import { typeLabel, typeLabels, TYPE_SLUGS, typeTileClass } from '../../core/pokemon-type';
import { PokemonSpriteComponent } from './pokemon-sprite.component';

interface PokedexTile {
  readonly id: number;
  readonly name: string;
  readonly number: string;
  readonly imageUrl: string;
  readonly tileClass: string;
  readonly types: readonly string[];
}

const TILE_BASE =
  'relative flex h-28 flex-col justify-between gap-2 overflow-hidden rounded-2xl p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50';

const ROW_HEIGHT = 124;

const ALL = 'all';

const STAGE_ITEMS: ToggleGroupItem[] = [
  { value: ALL, label: 'Tous' },
  { value: '0', label: 'Base' },
  { value: '1', label: 'Évolution' },
  { value: '2', label: 'Finale' },
];

const LEGENDARY_ITEMS: ToggleGroupItem[] = [
  { value: ALL, label: 'Tous' },
  { value: 'legendary', label: 'Légendaires' },
  { value: 'ordinary', label: 'Non légendaires' },
];

const MEGA_ITEMS: ToggleGroupItem[] = [
  { value: ALL, label: 'Tous' },
  { value: 'mega', label: 'Méga uniquement' },
  { value: 'ordinary', label: 'Masquer les méga' },
];

const DIRECTION_ITEMS: ToggleGroupItem[] = [
  { value: 'desc', label: 'Décroissant' },
  { value: 'asc', label: 'Croissant' },
];

const TYPE_ITEMS: ToggleGroupItem[] = TYPE_SLUGS.map(slug => ({ value: slug, label: typeLabel(slug) }));

interface SortOption {
  readonly value: string;
  readonly label: string;
}

const SORT_OPTIONS: readonly SortOption[] = [
  { value: 'number', label: 'Numéro' },
  { value: 'total', label: 'Total' },
  { value: 'type', label: 'Type' },
  ...STAT_ORDER.map(stat => ({ value: stat, label: STAT_META[stat].label })),
];

const DEFAULT_SORT_FIELD = 'number';
const DEFAULT_SORT_DIRECTION = 'asc';

const STAGE_VALUES: readonly string[] = STAGE_ITEMS.map(item => item.value);
const LEGENDARY_VALUES: readonly string[] = LEGENDARY_ITEMS.map(item => item.value);
const MEGA_VALUES: readonly string[] = MEGA_ITEMS.map(item => item.value);
const DIRECTION_VALUES: readonly string[] = DIRECTION_ITEMS.map(item => item.value);
const SORT_VALUES: readonly string[] = SORT_OPTIONS.map(option => option.value);

const STAT_SET = new Set<string>(STAT_ORDER);

function sortKey(pokemon: Pokemon, field: string): number | string {
  if (field === 'total') {
    return pokemonTotal(pokemon);
  }
  if (field === 'type') {
    return pokemon.types[0] ?? '';
  }
  if (STAT_SET.has(field)) {
    return pokemon.stats[field as Stat];
  }
  return pokemon.id;
}

function asArray(value: string | string[]): string[] {
  return Array.isArray(value) ? value : [value];
}

function toTile(pokemon: Pokemon): PokedexTile {
  const name = pokemonName(pokemon, LANG.fr);
  return {
    id: pokemon.id,
    name,
    number: pokemon.id < 10000 ? `Nº${pokemon.id}` : '',
    imageUrl: pokemonImageUrl(pokemon.id),
    tileClass: `${TILE_BASE} ${typeTileClass(pokemon.types[0])}`,
    types: typeLabels(pokemon.types),
  };
}

@Component({
  selector: 'app-pokedex-grid',
  imports: [
    ScrollingModule,
    NgIcon,
    BadgeComponent,
    ButtonComponent,
    EmptyComponent,
    FabButtonComponent,
    FabContainerComponent,
    FabListComponent,
    InputDirective,
    ToggleGroupComponent,
    PokemonSpriteComponent,
    ...SelectImports,
  ],
  template: `
    <div class="flex min-h-0 flex-col gap-3">
      <div class="border-border flex items-center gap-2 rounded-lg border px-3">
        <ng-icon name="phosphorMagnifyingGlass" class="text-muted-foreground size-4 shrink-0" />
        <input
          app-input
          borderless
          type="text"
          placeholder="Rechercher un Pokémon (fr, en, de, ja, « mega »…)"
          class="flex-1"
          [value]="query()"
          (input)="onSearchInput($event)"
        />
      </div>

      @if (disabledPicking()) {
        <p class="text-muted-foreground text-center text-xs">{{ disabledHint() }}</p>
      }

      @if (tiles().length === 0) {
        <app-empty
          icon="phosphorMagnifyingGlass"
          title="Aucun résultat"
          description="Essayez un autre nom, ou ajustez les filtres."
        />
      } @else {
        <cdk-virtual-scroll-viewport [itemSize]="rowHeight" class="w-full" [class]="viewportClass()">
          <div
            *cdkVirtualFor="let row of rows(); trackBy: trackByIndex"
            class="grid gap-3"
            [style.grid-template-columns]="gridColumns()"
            [style.height.px]="rowHeight"
          >
            @for (item of row; track item.id) {
              <button type="button" [class]="item.tileClass" [disabled]="disabledPicking()" (click)="select.emit(item.id)">
                <div class="flex items-start justify-between gap-2">
                  <div class="flex min-w-0 flex-col">
                    <span class="truncate text-sm font-semibold leading-tight">{{ item.name }}</span>
                    @if (item.number) {
                      <span class="text-xs opacity-80">{{ item.number }}</span>
                    }
                  </div>
                  <app-pokemon-sprite class="size-12" [src]="item.imageUrl" [alt]="item.name" />
                </div>
                <div class="flex flex-wrap gap-1">
                  @for (type of item.types; track type) {
                    <app-badge type="secondary">{{ type }}</app-badge>
                  }
                </div>
              </button>
            }
          </div>
        </cdk-virtual-scroll-viewport>
      }
    </div>

    <app-fab
      triggerIcon="phosphorSliders"
      triggerLabel="Filtrer et trier"
      badgeType="secondary"
      [badge]="activeCount()"
    >
      <app-fab-list>
        <button
          appFabButton
          type="button"
          aria-label="Filtrer"
          badgeType="secondary"
          [badge]="activeFilterCount()"
          (click)="openFilters()"
        >
          <ng-icon name="phosphorFunnel" class="size-5" />
        </button>
        <button
          appFabButton
          type="button"
          aria-label="Trier"
          badgeType="secondary"
          [badge]="activeSortCount()"
          (click)="openSort()"
        >
          <ng-icon name="phosphorArrowsDownUp" class="size-5" />
        </button>
        @if (activeCount() > 0) {
          <button
            appFabButton
            type="button"
            variant="secondary"
            aria-label="Effacer les filtres et le tri"
            (click)="clearAll()"
          >
            <ng-icon name="phosphorTrash" class="size-5" />
          </button>
        }
      </app-fab-list>
    </app-fab>

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
            <h3 class="text-sm font-semibold">Stade d'évolution</h3>
            <app-toggle-group
              mode="single"
              class="flex-wrap justify-start"
              [items]="stageItems"
              [value]="stageFilter()"
              (valueChange)="onStageChange($event)"
            />
          </section>

          <section class="flex flex-col gap-2">
            <h3 class="text-sm font-semibold">Légendaires</h3>
            <app-toggle-group
              mode="single"
              class="justify-start"
              [items]="legendaryItems"
              [value]="legendaryFilter()"
              (valueChange)="onLegendaryChange($event)"
            />
          </section>

          <section class="flex flex-col gap-2">
            <h3 class="text-sm font-semibold">Méga-évolutions</h3>
            <app-toggle-group
              mode="single"
              class="flex-wrap justify-start"
              [items]="megaItems"
              [value]="megaFilter()"
              (valueChange)="onMegaChange($event)"
            />
          </section>
        }

        <section class="flex flex-col gap-2">
          <h3 class="text-sm font-semibold">Talent</h3>
          <app-select
            [multiple]="true"
            withSearch
            class="w-full"
            placeholder="Filtrer par talent"
            searchPlaceholder="Rechercher un talent (toutes langues)"
            emptyText="Aucun talent trouvé."
            [maxLabelCount]="2"
            [value]="selectedAbilities()"
            (selectionChange)="onAbilitiesChange($event)"
          >
            @for (ability of availableAbilities(); track ability.slug) {
              <app-select-item [value]="ability.slug" [searchKeywords]="ability.searchText">
                {{ ability.label }}
              </app-select-item>
            }
          </app-select>
        </section>

        <div class="flex items-center justify-between gap-2">
          <span class="text-muted-foreground text-sm">{{ tiles().length }} résultat(s)</span>
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
            <app-select [value]="sortField()" (selectionChange)="onSortFieldChange($event)">
              @for (option of sortOptions; track option.value) {
                <app-select-item [value]="option.value">{{ option.label }}</app-select-item>
              }
            </app-select>
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
export class PokedexGridComponent {
  readonly pokemons = input.required<readonly Pokemon[]>();
  readonly abilities = input<readonly Ability[]>([]);
  readonly excludedIds = input<ReadonlySet<number>>(new Set<number>());
  readonly disabledPicking = input<boolean>(false);
  readonly disabledHint = input<string>('');
  readonly viewportClass = input<string>('h-[70dvh]');
  readonly syncUrl = input<boolean>(false);

  readonly select = output<number>();

  readonly #sheet = inject(SheetService);
  readonly #viewContainerRef = inject(ViewContainerRef);
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly #destroyRef = inject(DestroyRef);

  private readonly filtersTemplate = viewChild.required<TemplateRef<unknown>>('filtersSheet');
  private readonly sortTemplate = viewChild.required<TemplateRef<unknown>>('sortSheet');

  protected readonly rowHeight = ROW_HEIGHT;
  protected readonly typeItems = TYPE_ITEMS;
  protected readonly stageItems = STAGE_ITEMS;
  protected readonly legendaryItems = LEGENDARY_ITEMS;
  protected readonly megaItems = MEGA_ITEMS;
  protected readonly directionItems = DIRECTION_ITEMS;
  protected readonly sortOptions = SORT_OPTIONS;
  protected readonly trackByIndex = (index: number): number => index;

  readonly #url = injectQueryFilters({
    q: stringFilter(),
    types: arrayFilter(),
    stage: enumFilter(STAGE_VALUES, ALL),
    legendary: enumFilter(LEGENDARY_VALUES, ALL),
    mega: enumFilter(MEGA_VALUES, ALL),
    abilities: arrayFilter(),
    sort: enumFilter(SORT_VALUES, DEFAULT_SORT_FIELD),
    dir: enumFilter(DIRECTION_VALUES, DEFAULT_SORT_DIRECTION),
  });

  readonly #query = signal('');
  readonly #selectedTypes = signal<string[]>([]);
  readonly #stageFilter = signal<string>(ALL);
  readonly #legendaryFilter = signal<string>(ALL);
  readonly #megaFilter = signal<string>(ALL);
  readonly #selectedAbilities = signal<string[]>([]);
  readonly #sortField = signal<string>(DEFAULT_SORT_FIELD);
  readonly #sortDirection = signal<string>(DEFAULT_SORT_DIRECTION);
  readonly #resetKey = signal(0);
  readonly #columns = signal(2);

  protected readonly query = computed(() => (this.syncUrl() ? this.#url.q() : this.#query()));
  protected readonly selectedTypes = computed<readonly string[]>(() =>
    this.syncUrl() ? this.#url.types() : this.#selectedTypes(),
  );
  protected readonly stageFilter = computed(() =>
    this.syncUrl() ? this.#url.stage() : this.#stageFilter(),
  );
  protected readonly legendaryFilter = computed(() =>
    this.syncUrl() ? this.#url.legendary() : this.#legendaryFilter(),
  );
  protected readonly megaFilter = computed(() =>
    this.syncUrl() ? this.#url.mega() : this.#megaFilter(),
  );
  protected readonly sortField = computed(() =>
    this.syncUrl() ? this.#url.sort() : this.#sortField(),
  );
  protected readonly sortDirection = computed(() =>
    this.syncUrl() ? this.#url.dir() : this.#sortDirection(),
  );
  readonly #effectiveAbilities = computed<readonly string[]>(() =>
    this.syncUrl() ? this.#url.abilities() : this.#selectedAbilities(),
  );
  protected readonly selectedAbilities = computed<string[]>(() => [...this.#effectiveAbilities()]);
  protected readonly resetKeys = computed(() => [this.#resetKey()]);

  protected readonly activeFilterCount = computed(
    () =>
      this.selectedTypes().length +
      this.#effectiveAbilities().length +
      (this.stageFilter() !== ALL ? 1 : 0) +
      (this.legendaryFilter() !== ALL ? 1 : 0) +
      (this.megaFilter() !== ALL ? 1 : 0),
  );

  protected readonly activeSortCount = computed(() =>
    this.sortField() !== DEFAULT_SORT_FIELD || this.sortDirection() !== DEFAULT_SORT_DIRECTION
      ? 1
      : 0,
  );

  protected readonly activeCount = computed(() => this.activeFilterCount() + this.activeSortCount());

  protected readonly availableAbilities = computed<readonly Ability[]>(() => {
    const present = new Set(this.pokemons().flatMap(pokemon => pokemon.abilitySlugs));
    return this.abilities().filter(ability => present.has(ability.slug));
  });

  protected readonly tiles = computed<readonly PokedexTile[]>(() => {
    const excluded = this.excludedIds();
    const types = new Set(this.selectedTypes());
    const stage = this.stageFilter();
    const legendary = this.legendaryFilter();
    const mega = this.megaFilter();
    const abilities = new Set(this.#effectiveAbilities());

    const filtered = this.pokemons()
      .filter(pokemon => !excluded.has(pokemon.id))
      .filter(pokemon => types.size === 0 || pokemon.types.some(type => types.has(type)))
      .filter(pokemon => stage === ALL || pokemon.stage === Number(stage))
      .filter(
        pokemon =>
          legendary === ALL ||
          (legendary === 'legendary' ? pokemon.legendary : !pokemon.legendary),
      )
      .filter(pokemon => mega === ALL || (mega === 'mega' ? pokemon.mega : !pokemon.mega))
      .filter(
        pokemon =>
          abilities.size === 0 || pokemon.abilitySlugs.some(slug => abilities.has(slug)),
      );

    const query = this.query();
    if (query.trim()) {
      return searchPokemons(filtered, query, new Set<number>()).map(match => toTile(match.pokemon));
    }

    const field = this.sortField();
    const ascending = this.sortDirection() === 'asc';
    return [...filtered]
      .sort((a, b) => {
        const keyA = sortKey(a, field);
        const keyB = sortKey(b, field);
        if (keyA < keyB) {
          return ascending ? -1 : 1;
        }
        if (keyA > keyB) {
          return ascending ? 1 : -1;
        }
        return a.id - b.id;
      })
      .map(toTile);
  });

  protected readonly gridColumns = computed(() => `repeat(${this.#columns()}, minmax(0, 1fr))`);

  protected readonly rows = computed<readonly (readonly PokedexTile[])[]>(() => {
    const columns = this.#columns();
    const items = this.tiles();
    const rowCount = Math.ceil(items.length / columns);
    return Array.from({ length: rowCount }, (_, index) =>
      items.slice(index * columns, index * columns + columns),
    );
  });

  constructor() {
    afterNextRender(() => {
      const observer = new ResizeObserver(entries => {
        const width = entries[0]?.contentRect.width ?? 0;
        this.#columns.set(width < 640 ? 2 : width < 900 ? 3 : 4);
      });
      observer.observe(this.#host.nativeElement);
      this.#destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  protected onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (this.syncUrl()) {
      this.#url.set('q', value);
      return;
    }
    this.#query.set(value);
  }

  protected openFilters(): void {
    this.#sheet.create({
      content: this.filtersTemplate(),
      side: 'bottom',
      title: 'Filtrer',
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
      title: 'Trier',
      hideFooter: true,
      maskClosable: true,
      viewContainerRef: this.#viewContainerRef,
      customClasses: 'p-4',
    });
  }

  protected onTypesChange(value: string | string[]): void {
    const types = asArray(value);
    if (this.syncUrl()) {
      this.#url.set('types', types);
      return;
    }
    this.#selectedTypes.set(types);
  }

  protected onStageChange(value: string | string[]): void {
    const stage = asArray(value)[0] ?? ALL;
    if (this.syncUrl()) {
      this.#url.set('stage', stage);
      return;
    }
    this.#stageFilter.set(stage);
  }

  protected onLegendaryChange(value: string | string[]): void {
    const legendary = asArray(value)[0] ?? ALL;
    if (this.syncUrl()) {
      this.#url.set('legendary', legendary);
      return;
    }
    this.#legendaryFilter.set(legendary);
  }

  protected onMegaChange(value: string | string[]): void {
    const mega = asArray(value)[0] ?? ALL;
    if (this.syncUrl()) {
      this.#url.set('mega', mega);
      return;
    }
    this.#megaFilter.set(mega);
  }

  protected onAbilitiesChange(value: string | string[]): void {
    const abilities = asArray(value);
    if (this.syncUrl()) {
      this.#url.set('abilities', abilities);
      return;
    }
    this.#selectedAbilities.set(abilities);
  }

  protected onSortFieldChange(value: string | string[]): void {
    const field = asArray(value)[0] ?? DEFAULT_SORT_FIELD;
    if (this.syncUrl()) {
      this.#url.set('sort', field);
      return;
    }
    this.#sortField.set(field);
  }

  protected onDirectionChange(value: string | string[]): void {
    const direction = asArray(value)[0] ?? DEFAULT_SORT_DIRECTION;
    if (this.syncUrl()) {
      this.#url.set('dir', direction);
      return;
    }
    this.#sortDirection.set(direction);
  }

  protected resetFilters(): void {
    if (this.syncUrl()) {
      this.#url.patch({ types: [], stage: ALL, legendary: ALL, mega: ALL, abilities: [] });
    } else {
      this.#selectedTypes.set([]);
      this.#stageFilter.set(ALL);
      this.#legendaryFilter.set(ALL);
      this.#megaFilter.set(ALL);
      this.#selectedAbilities.set([]);
    }
    this.#resetKey.update(key => key + 1);
  }

  protected resetSort(): void {
    if (this.syncUrl()) {
      this.#url.patch({ sort: DEFAULT_SORT_FIELD, dir: DEFAULT_SORT_DIRECTION });
    } else {
      this.#sortField.set(DEFAULT_SORT_FIELD);
      this.#sortDirection.set(DEFAULT_SORT_DIRECTION);
    }
    this.#resetKey.update(key => key + 1);
  }

  protected clearAll(): void {
    if (this.syncUrl()) {
      this.#url.patch({
        types: [],
        stage: ALL,
        legendary: ALL,
        mega: ALL,
        abilities: [],
        sort: DEFAULT_SORT_FIELD,
        dir: DEFAULT_SORT_DIRECTION,
      });
    } else {
      this.#selectedTypes.set([]);
      this.#stageFilter.set(ALL);
      this.#legendaryFilter.set(ALL);
      this.#megaFilter.set(ALL);
      this.#selectedAbilities.set([]);
      this.#sortField.set(DEFAULT_SORT_FIELD);
      this.#sortDirection.set(DEFAULT_SORT_DIRECTION);
    }
    this.#resetKey.update(key => key + 1);
  }
}
