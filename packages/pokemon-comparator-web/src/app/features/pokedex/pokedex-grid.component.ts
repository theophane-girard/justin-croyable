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
  ButtonComponent,
  ChipComponent,
  EmptyComponent,
  FabButtonComponent,
  FabContainerComponent,
  FabListComponent,
  InputDirective,
  BadgeComponent,
  SelectImports,
  SheetService,
  ToggleGroupComponent,
  type ToggleGroupItem,
} from '@justin-croyable/design-system';
import { NgIcon } from '@ng-icons/core';

import { type Ability } from '../../core/pokemon-ability';
import { normalizeText, searchPokemons } from '../../core/pokemon-search';
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

const ABILITY_RESULT_LIMIT = 60;

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
    ChipComponent,
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

    <app-fab triggerIcon="phosphorSliders" triggerLabel="Filtrer et trier">
      <app-fab-list>
        <button appFabButton type="button" aria-label="Filtrer" (click)="openFilters()">
          <ng-icon name="phosphorFunnel" class="size-5" />
        </button>
        <button appFabButton type="button" aria-label="Trier" (click)="openSort()">
          <ng-icon name="phosphorArrowsDownUp" class="size-5" />
        </button>
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
        }

        <section class="flex flex-col gap-2">
          <h3 class="text-sm font-semibold">Talent</h3>
          @if (selectedAbilityViews().length > 0) {
            <div class="flex flex-wrap gap-1.5">
              @for (ability of selectedAbilityViews(); track ability.slug) {
                <app-chip [removeLabel]="'Retirer ' + ability.label" (removed)="toggleAbility(ability.slug)">
                  {{ ability.label }}
                </app-chip>
              }
            </div>
          }
          <div class="border-border flex items-center gap-2 rounded-lg border px-3">
            <ng-icon name="phosphorMagnifyingGlass" class="text-muted-foreground size-4 shrink-0" />
            <input
              app-input
              borderless
              type="text"
              placeholder="Rechercher un talent (toutes langues)"
              class="flex-1"
              [value]="abilityQuery()"
              (input)="onAbilityQueryInput($event)"
            />
          </div>
          @if (abilityResults().items.length === 0) {
            <span class="text-muted-foreground text-sm">Aucun talent trouvé.</span>
          } @else {
            <div class="flex max-h-56 flex-col gap-1 overflow-y-auto pr-1">
              @for (ability of abilityResults().items; track ability.slug) {
                <button
                  appButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  class="justify-start"
                  (click)="toggleAbility(ability.slug)"
                >
                  <ng-icon name="phosphorPlus" class="size-4 shrink-0" />
                  {{ ability.label }}
                </button>
              }
            </div>
            @if (abilityResults().total > abilityResults().items.length) {
              <span class="text-muted-foreground text-xs">
                {{ abilityResults().total }} talents — affinez la recherche.
              </span>
            }
          }
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
  protected readonly directionItems = DIRECTION_ITEMS;
  protected readonly sortOptions = SORT_OPTIONS;
  protected readonly trackByIndex = (index: number): number => index;

  readonly #query = signal('');
  readonly #selectedTypes = signal<string[]>([]);
  readonly #stageFilter = signal<string>(ALL);
  readonly #legendaryFilter = signal<string>(ALL);
  readonly #selectedAbilities = signal<string[]>([]);
  readonly #abilityQuery = signal('');
  readonly #sortField = signal<string>('number');
  readonly #sortDirection = signal<string>('asc');
  readonly #resetKey = signal(0);
  readonly #columns = signal(2);

  protected readonly query = this.#query.asReadonly();
  protected readonly selectedTypes = this.#selectedTypes.asReadonly();
  protected readonly stageFilter = this.#stageFilter.asReadonly();
  protected readonly legendaryFilter = this.#legendaryFilter.asReadonly();
  protected readonly abilityQuery = this.#abilityQuery.asReadonly();
  protected readonly sortField = this.#sortField.asReadonly();
  protected readonly sortDirection = this.#sortDirection.asReadonly();
  protected readonly resetKeys = computed(() => [this.#resetKey()]);

  readonly #availableAbilities = computed<readonly Ability[]>(() => {
    const present = new Set(this.pokemons().flatMap(pokemon => pokemon.abilitySlugs));
    return this.abilities().filter(ability => present.has(ability.slug));
  });

  protected readonly selectedAbilityViews = computed<readonly Ability[]>(() => {
    const selected = new Set(this.#selectedAbilities());
    return this.#availableAbilities().filter(ability => selected.has(ability.slug));
  });

  protected readonly abilityResults = computed<{ items: readonly Ability[]; total: number }>(() => {
    const needle = normalizeText(this.#abilityQuery());
    const selected = new Set(this.#selectedAbilities());
    const matches = this.#availableAbilities()
      .filter(ability => !selected.has(ability.slug))
      .filter(ability => needle.length === 0 || ability.searchText.includes(needle));
    return { items: matches.slice(0, ABILITY_RESULT_LIMIT), total: matches.length };
  });

  protected readonly tiles = computed<readonly PokedexTile[]>(() => {
    const excluded = this.excludedIds();
    const types = new Set(this.#selectedTypes());
    const stage = this.#stageFilter();
    const legendary = this.#legendaryFilter();
    const abilities = new Set(this.#selectedAbilities());

    const filtered = this.pokemons()
      .filter(pokemon => !excluded.has(pokemon.id))
      .filter(pokemon => types.size === 0 || pokemon.types.some(type => types.has(type)))
      .filter(pokemon => stage === ALL || pokemon.stage === Number(stage))
      .filter(
        pokemon =>
          legendary === ALL ||
          (legendary === 'legendary' ? pokemon.legendary : !pokemon.legendary),
      )
      .filter(
        pokemon =>
          abilities.size === 0 || pokemon.abilitySlugs.some(slug => abilities.has(slug)),
      );

    const query = this.#query();
    if (query.trim()) {
      return searchPokemons(filtered, query, new Set<number>()).map(match => toTile(match.pokemon));
    }

    const field = this.#sortField();
    const ascending = this.#sortDirection() === 'asc';
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
    this.#query.set((event.target as HTMLInputElement).value);
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
    this.#selectedTypes.set(asArray(value));
  }

  protected onStageChange(value: string | string[]): void {
    this.#stageFilter.set(asArray(value)[0] ?? ALL);
  }

  protected onLegendaryChange(value: string | string[]): void {
    this.#legendaryFilter.set(asArray(value)[0] ?? ALL);
  }

  protected onAbilityQueryInput(event: Event): void {
    this.#abilityQuery.set((event.target as HTMLInputElement).value);
  }

  protected toggleAbility(slug: string): void {
    const current = this.#selectedAbilities();
    this.#selectedAbilities.set(
      current.includes(slug) ? current.filter(entry => entry !== slug) : [...current, slug],
    );
  }

  protected onSortFieldChange(value: string | string[]): void {
    this.#sortField.set(asArray(value)[0] ?? 'number');
  }

  protected onDirectionChange(value: string | string[]): void {
    this.#sortDirection.set(asArray(value)[0] ?? 'asc');
  }

  protected resetFilters(): void {
    this.#selectedTypes.set([]);
    this.#stageFilter.set(ALL);
    this.#legendaryFilter.set(ALL);
    this.#selectedAbilities.set([]);
    this.#abilityQuery.set('');
    this.#resetKey.update(key => key + 1);
  }

  protected resetSort(): void {
    this.#sortField.set('number');
    this.#sortDirection.set('asc');
    this.#resetKey.update(key => key + 1);
  }
}
