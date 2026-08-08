import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  type TemplateRef,
  ViewContainerRef,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';

import {
  ButtonComponent,
  EmptyComponent,
  FabButtonComponent,
  SelectImports,
  SheetService,
  SpinnerComponent,
  SwitchComponent,
  ToggleGroupComponent,
  type ToggleGroupItem,
} from '@justin-croyable/design-system';
import { NgIcon } from '@ng-icons/core';

import { ComparatorStore } from '../../core/comparator-store';
import { APP_PATHS } from '../../app.routes';
import {
  type Pokemon,
  pokemonTotal,
  type Stat,
  STAT_META,
  STAT_ORDER,
} from '../../core/pokemon.model';
import { typeLabel, TYPE_SLUGS } from '../../core/pokemon-type';
import { PokedexGridComponent } from './pokedex-grid.component';

const ALL_STAGES = 'all';

const STAGE_ITEMS: ToggleGroupItem[] = [
  { value: ALL_STAGES, label: 'Tous' },
  { value: '0', label: 'Base' },
  { value: '1', label: 'Évolution' },
  { value: '2', label: 'Finale' },
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
  if (field === 'number') {
    return pokemon.id;
  }
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

@Component({
  selector: 'app-pokedex',
  imports: [
    NgIcon,
    ButtonComponent,
    EmptyComponent,
    FabButtonComponent,
    SpinnerComponent,
    SwitchComponent,
    ToggleGroupComponent,
    PokedexGridComponent,
    ...SelectImports,
  ],
  template: `
    <div class="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header class="flex flex-col gap-1">
        <div class="flex items-center gap-2">
          <ng-icon name="phosphorSquaresFour" class="text-primary size-7 shrink-0" />
          <h1 class="text-2xl font-semibold tracking-tight">Pokédex</h1>
        </div>
        <p class="text-muted-foreground text-sm">
          Parcourez les Pokémon, filtrez et triez, puis ouvrez un Pokémon pour son détail.
        </p>
      </header>

      @if (store.isLoading()) {
        <div class="flex flex-col items-center justify-center gap-3 py-16">
          <app-spinner class="text-primary size-8" />
          <p class="text-muted-foreground text-sm">Chargement du Pokédex…</p>
        </div>
      } @else if (store.hasError()) {
        <div class="flex flex-col items-center gap-4">
          <app-empty
            icon="phosphorWarningCircle"
            title="Impossible de charger les Pokémon"
            description="La récupération des données depuis l'API PokéAPI a échoué. Vérifiez votre connexion."
          />
          <button appButton type="button" variant="outline" (click)="reload()">
            <ng-icon name="phosphorArrowClockwise" class="size-4" />
            Réessayer
          </button>
        </div>
      } @else {
        <app-pokedex-grid [pokemons]="filtered()" (select)="openDetail($event)" />
      }
    </div>

    @if (!store.isLoading() && !store.hasError()) {
      <button
        appFabButton
        type="button"
        position="bottom-right"
        aria-label="Filtrer et trier"
        (click)="openFilters()"
      >
        <ng-icon name="phosphorFunnel" class="size-5" />
      </button>
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
            <h3 class="text-sm font-semibold">Stade d'évolution</h3>
            <app-toggle-group
              mode="single"
              class="flex-wrap justify-start"
              [items]="stageItems"
              [value]="stageFilter()"
              (valueChange)="onStageChange($event)"
            />
          </section>

          <section class="flex items-center justify-between gap-2">
            <h3 class="text-sm font-semibold">Légendaires uniquement</h3>
            <app-switch [checked]="legendaryOnly()" (checkedChange)="onLegendaryChange($event)" />
          </section>

          <section class="flex flex-col gap-2">
            <h3 class="text-sm font-semibold">Trier par</h3>
            <app-select [value]="sortField()" (selectionChange)="onSortFieldChange($event)">
              @for (option of sortOptions; track option.value) {
                <app-select-item [value]="option.value">{{ option.label }}</app-select-item>
              }
            </app-select>
            <app-toggle-group
              mode="single"
              class="justify-start"
              [items]="directionItems"
              [value]="sortDirection()"
              (valueChange)="onDirectionChange($event)"
            />
          </section>
        }

        <div class="flex items-center justify-between gap-2">
          <span class="text-muted-foreground text-sm">{{ filtered().length }} résultat(s)</span>
          <button appButton type="button" variant="ghost" size="sm" (click)="resetFilters()">
            <ng-icon name="phosphorArrowClockwise" class="size-4" />
            Réinitialiser
          </button>
        </div>
      </div>
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokedexComponent {
  protected readonly store = inject(ComparatorStore);
  readonly #router = inject(Router);
  readonly #sheet = inject(SheetService);
  readonly #viewContainerRef = inject(ViewContainerRef);

  private readonly filtersTemplate = viewChild.required<TemplateRef<unknown>>('filtersSheet');

  protected readonly typeItems = TYPE_ITEMS;
  protected readonly stageItems = STAGE_ITEMS;
  protected readonly directionItems = DIRECTION_ITEMS;
  protected readonly sortOptions = SORT_OPTIONS;

  readonly #selectedTypes = signal<string[]>([]);
  readonly #stageFilter = signal<string>(ALL_STAGES);
  readonly #legendaryOnly = signal<boolean>(false);
  readonly #sortField = signal<string>('number');
  readonly #sortDirection = signal<string>('asc');
  readonly #resetKey = signal(0);

  protected readonly resetKeys = computed(() => [this.#resetKey()]);

  protected readonly selectedTypes = this.#selectedTypes.asReadonly();
  protected readonly stageFilter = this.#stageFilter.asReadonly();
  protected readonly legendaryOnly = this.#legendaryOnly.asReadonly();
  protected readonly sortField = this.#sortField.asReadonly();
  protected readonly sortDirection = this.#sortDirection.asReadonly();

  protected readonly filtered = computed<readonly Pokemon[]>(() => {
    const types = new Set(this.#selectedTypes());
    const stage = this.#stageFilter();
    const legendaryOnly = this.#legendaryOnly();
    const field = this.#sortField();
    const ascending = this.#sortDirection() === 'asc';

    const result = this.store
      .pokemons()
      .filter(pokemon => types.size === 0 || pokemon.types.some(type => types.has(type)))
      .filter(pokemon => stage === ALL_STAGES || pokemon.stage === Number(stage))
      .filter(pokemon => !legendaryOnly || pokemon.legendary);

    const sorted = [...result].sort((a, b) => {
      const keyA = sortKey(a, field);
      const keyB = sortKey(b, field);
      if (keyA < keyB) {
        return ascending ? -1 : 1;
      }
      if (keyA > keyB) {
        return ascending ? 1 : -1;
      }
      return a.id - b.id;
    });
    return sorted;
  });

  protected openDetail(id: number): void {
    this.#router.navigate([`/${APP_PATHS.pokedex}`, id]);
  }

  protected openFilters(): void {
    this.#sheet.create({
      content: this.filtersTemplate(),
      side: 'bottom',
      title: 'Filtrer & trier',
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
    this.#stageFilter.set(asArray(value)[0] ?? ALL_STAGES);
  }

  protected onLegendaryChange(checked: boolean): void {
    this.#legendaryOnly.set(checked);
  }

  protected onSortFieldChange(value: string | string[]): void {
    this.#sortField.set(asArray(value)[0] ?? 'number');
  }

  protected onDirectionChange(value: string | string[]): void {
    this.#sortDirection.set(asArray(value)[0] ?? 'asc');
  }

  protected resetFilters(): void {
    this.#selectedTypes.set([]);
    this.#stageFilter.set(ALL_STAGES);
    this.#legendaryOnly.set(false);
    this.#sortField.set('number');
    this.#sortDirection.set('asc');
    this.#resetKey.update(key => key + 1);
  }

  protected reload(): void {
    this.store.reload();
  }
}
