import { httpResource } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { ActivatedRoute, type Params, Router, RouterLink } from '@angular/router';

import {
  BadgeComponent,
  ButtonComponent,
  DetailSkeletonComponent,
  EmptyComponent,
  PopoverComponent,
  PopoverDirective,
  ProgressComponent,
  SkeletonComponent,
  TabComponent,
  TabGroupComponent,
} from '@justin-croyable/design-system';
import { NgIcon } from '@ng-icons/core';

import { ComparatorStore } from '../../core/comparator-store';
import { APP_PATHS } from '../../app.routes';
import {
  EMPTY_DETAIL,
  MOVE_EFFECTS_QUERY,
  POKEAPI_GRAPHQL_URL,
  POKEMON_DETAIL_QUERY,
  type PokemonAbility,
  type PokemonMove,
  parseMoveEffects,
  parsePokemonDetail,
} from '../../core/pokemon-detail';
import {
  EVOLUTION_STAGE_LABEL,
  LANG,
  type Pokemon,
  pokemonImageUrl,
  pokemonName,
  STAT_META,
  STAT_ORDER,
} from '../../core/pokemon.model';
import {
  applyEnhancedStats,
  type EnhanceConfig,
  enhancedStatScaleMax,
  statsTotal,
} from '../../core/pokemon-stats';
import {
  typeBarClass,
  typeLabels,
  typeTileClass,
  type TypeMatchup,
  typeWeaknesses,
} from '../../core/pokemon-type';
import {
  CONFIG_PARAM_PREFIX,
  decodeEnhanceConfig,
  encodeEnhanceConfig,
} from '../enhance/enhance-url';
import { StatEnhancerComponent } from '../enhance/stat-enhancer.component';
import { PokemonMovesComponent } from './pokemon-moves.component';

const ROUTE_ID_PARAM = 'id';

const TAG_STAGE = 'border-transparent bg-sky-500/15 text-sky-700 dark:text-sky-300';
const TAG_LEGENDARY = 'border-transparent bg-amber-500/20 text-amber-700 dark:text-amber-300';
const TAG_ORDINARY = 'border-transparent bg-slate-500/15 text-slate-700 dark:text-slate-300';
const TAG_TOTAL = 'border-transparent bg-violet-500/15 text-violet-700 dark:text-violet-300';

interface InfoTag {
  readonly label: string;
  readonly class: string;
}

interface StatRow {
  readonly key: string;
  readonly label: string;
  readonly value: number;
  readonly percent: number;
}

interface DetailView {
  readonly id: number;
  readonly name: string;
  readonly number: string;
  readonly imageUrl: string;
  readonly headerClass: string;
  readonly barClass: string;
  readonly types: readonly string[];
  readonly info: readonly InfoTag[];
  readonly weaknesses: readonly TypeMatchup[];
  readonly stats: readonly StatRow[];
  readonly total: number;
}

function toDetail(pokemon: Pokemon, config: EnhanceConfig): DetailView {
  const name = pokemonName(pokemon, LANG.fr);
  const stats = applyEnhancedStats(pokemon.stats, config);
  const scaleMax = enhancedStatScaleMax(config);
  const total = statsTotal(stats);
  return {
    id: pokemon.id,
    name,
    number: pokemon.id < 10000 ? `Nº${pokemon.id}` : 'Forme spéciale',
    imageUrl: pokemonImageUrl(pokemon.id),
    headerClass: typeTileClass(pokemon.types[0]),
    barClass: typeBarClass(pokemon.types[0]),
    types: typeLabels(pokemon.types),
    weaknesses: typeWeaknesses(pokemon.types),
    info: [
      { label: `Stade : ${EVOLUTION_STAGE_LABEL[pokemon.stage]}`, class: TAG_STAGE },
      pokemon.legendary
        ? { label: 'Légendaire', class: TAG_LEGENDARY }
        : { label: 'Ordinaire', class: TAG_ORDINARY },
      { label: `Total ${total}`, class: TAG_TOTAL },
    ],
    stats: STAT_ORDER.map(stat => ({
      key: stat,
      label: STAT_META[stat].label,
      value: stats[stat],
      percent: Math.round((stats[stat] / scaleMax) * 100),
    })),
    total,
  };
}

@Component({
  selector: 'app-pokemon-detail',
  imports: [
    RouterLink,
    NgIcon,
    BadgeComponent,
    ButtonComponent,
    DetailSkeletonComponent,
    EmptyComponent,
    PopoverComponent,
    PopoverDirective,
    ProgressComponent,
    SkeletonComponent,
    TabGroupComponent,
    TabComponent,
    StatEnhancerComponent,
    PokemonMovesComponent,
  ],
  template: `
    <div class="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <a
        appButton
        type="button"
        variant="ghost"
        size="sm"
        class="w-fit"
        [routerLink]="pokedexLink"
        queryParamsHandling="preserve"
      >
        <ng-icon name="phosphorArrowLeft" class="size-4" />
        Retour au Pokédex
      </a>

      @let view = detail();
      @if (store.isLoading()) {
        <app-detail-skeleton />
      } @else if (!view) {
        <app-empty
          icon="phosphorMagnifyingGlass"
          title="Pokémon introuvable"
          description="Ce Pokémon n'existe pas ou les données ne sont pas encore chargées."
        />
      } @else {
        <div class="border-border overflow-hidden rounded-3xl border shadow-sm">
          <div [class]="view.headerClass" class="relative flex items-end justify-between gap-4 p-6">
            <div class="flex flex-col gap-2">
              <span class="text-sm font-medium opacity-80">{{ view.number }}</span>
              <h2 class="text-3xl font-bold tracking-tight">{{ view.name }}</h2>
              <div class="flex flex-wrap gap-1.5">
                @for (type of view.types; track type) {
                  <span class="rounded-full bg-black/15 px-2.5 py-0.5 text-xs font-medium">
                    {{ type }}
                  </span>
                }
              </div>
            </div>
            <img
              [src]="view.imageUrl"
              [alt]="view.name"
              class="size-32 shrink-0 object-contain drop-shadow-lg"
            />
          </div>

          <div class="bg-card p-4 sm:p-6">
            <app-tab-group>
              <app-tab label="Aperçu">
                <div class="flex flex-col gap-5 pt-4">
                  <section class="flex flex-col gap-2">
                    <h3 class="text-foreground text-sm font-semibold">Informations</h3>
                    <div class="flex flex-wrap gap-2">
                      @for (tag of view.info; track tag.label) {
                        <app-badge type="secondary" [class]="tag.class">{{ tag.label }}</app-badge>
                      }
                    </div>
                  </section>

                  <section class="flex flex-col gap-2">
                    <h3 class="text-foreground text-sm font-semibold">Faiblesses</h3>
                    @if (view.weaknesses.length === 0) {
                      <span class="text-muted-foreground text-sm">
                        Aucune faiblesse de type particulière.
                      </span>
                    } @else {
                      <div class="flex flex-wrap gap-2">
                        @for (weakness of view.weaknesses; track weakness.type) {
                          <span
                            [class]="weakness.tileClass"
                            class="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
                          >
                            {{ weakness.label }}
                            <span class="font-bold tabular-nums">×{{ weakness.multiplier }}</span>
                          </span>
                        }
                      </div>
                    }
                  </section>

                  <section class="flex flex-col gap-2">
                    <h3 class="text-foreground text-sm font-semibold">Talents</h3>
                    @if (detailLoading()) {
                      <div class="flex gap-2">
                        <app-skeleton class="h-8 w-24" />
                        <app-skeleton class="h-8 w-24" />
                      </div>
                    } @else if (abilities().length === 0) {
                      <span class="text-muted-foreground text-sm">Talents indisponibles.</span>
                    } @else {
                      <div class="flex flex-wrap gap-2">
                        @for (ability of abilities(); track ability.name) {
                          <button
                            appButton
                            type="button"
                            variant="outline"
                            size="sm"
                            appPopover
                            [content]="abilityPopover"
                            [mobileSheet]="true"
                            (click)="selectedAbility.set(ability)"
                          >
                            {{ ability.name }}
                            @if (ability.hidden) {
                              <span class="text-muted-foreground text-xs">(cachée)</span>
                            }
                            <ng-icon name="phosphorInfo" class="size-3.5 opacity-70" />
                          </button>
                        }
                      </div>
                    }
                  </section>

                  <section class="flex flex-col gap-2">
                    <div class="flex flex-wrap items-center justify-between gap-2">
                      <h3 class="text-foreground text-sm font-semibold">{{ statsHeading() }}</h3>
                      <div class="flex items-center gap-3">
                        <span class="text-muted-foreground text-sm">Total {{ view.total }}</span>
                        <app-stat-enhancer [targets]="enhanceTargets()" />
                      </div>
                    </div>
                    <div class="flex flex-col gap-2">
                      @for (row of view.stats; track row.key) {
                        <div class="flex items-center gap-3">
                          <span class="text-muted-foreground w-28 shrink-0 text-sm">{{ row.label }}</span>
                          <app-progress class="h-2.5 flex-1" [class]="view.barClass" [value]="row.percent" />
                          <span class="w-10 shrink-0 text-right text-sm font-medium tabular-nums">
                            {{ row.value }}
                          </span>
                        </div>
                      }
                    </div>
                  </section>

                  @if (isSelected()) {
                    <app-badge type="secondary" class="w-fit gap-1">
                      <ng-icon name="phosphorCheck" class="size-3" />
                      Ajouté au comparateur
                    </app-badge>
                  } @else {
                    <button
                      appButton
                      type="button"
                      class="w-fit"
                      [buttonDisabled]="store.isFull()"
                      (click)="add(view.id)"
                    >
                      <ng-icon name="phosphorPlus" class="size-4" />
                      Ajouter au comparateur
                    </button>
                  }
                </div>
              </app-tab>

              <app-tab label="Attaques">
                <div class="pt-4">
                  <app-pokemon-moves [moves]="moves()" [loading]="detailLoading()" />
                </div>
              </app-tab>
            </app-tab-group>
          </div>
        </div>
      }
    </div>

    <ng-template #abilityPopover>
      @let ability = selectedAbility();
      <app-popover class="max-w-xs">
        @if (ability) {
          <div class="flex flex-col gap-1 p-1">
            <h4 class="text-sm font-semibold">
              {{ ability.name }}
              @if (ability.hidden) {
                <span class="text-muted-foreground text-xs font-normal">(talent caché)</span>
              }
            </h4>
            <p class="text-muted-foreground text-sm">{{ ability.description }}</p>
          </div>
        }
      </app-popover>
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonDetailComponent {
  protected readonly store = inject(ComparatorStore);
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);

  readonly id = input.required<string>();

  constructor() {
    this.#restoreFromUrl();
    effect(() => this.#syncToUrl());
  }

  #restoreFromUrl(): void {
    const raw = this.#route.snapshot.queryParamMap.get(CONFIG_PARAM_PREFIX);
    if (!raw) {
      return;
    }
    const config = decodeEnhanceConfig(raw);
    const id = Number(this.#route.snapshot.paramMap.get(ROUTE_ID_PARAM));
    if (config && Number.isInteger(id)) {
      this.store.setEnhanceConfigs(new Map([[id, config]]));
    }
  }

  #syncToUrl(): void {
    const config = this.enhanceConfig();
    const queryParams: Params = {
      [CONFIG_PARAM_PREFIX]: config.level100 ? encodeEnhanceConfig(config) : null,
    };
    void this.#router.navigate([], {
      relativeTo: this.#route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  protected readonly pokedexLink = `/${APP_PATHS.pokedex}`;
  protected readonly selectedAbility = signal<PokemonAbility | undefined>(undefined);

  readonly #numericId = computed(() => Number(this.id()));

  readonly #pokemon = computed(() =>
    this.store.pokemons().find(entry => entry.id === this.#numericId()),
  );

  protected readonly enhanceConfig = computed(() => this.store.enhanceFor(this.#numericId()));

  protected readonly enhanceTargets = computed<readonly { id: number; name: string }[]>(() => {
    const pokemon = this.#pokemon();
    return pokemon ? [{ id: pokemon.id, name: pokemonName(pokemon, LANG.fr) }] : [];
  });

  protected readonly statsHeading = computed(() =>
    this.enhanceConfig().level100 ? 'Statistiques (niveau 100)' : 'Statistiques de base',
  );

  protected readonly detail = computed<DetailView | undefined>(() => {
    const pokemon = this.#pokemon();
    return pokemon ? toDetail(pokemon, this.enhanceConfig()) : undefined;
  });

  protected readonly isSelected = computed(() => this.store.selectedIdSet().has(this.#numericId()));

  readonly #detailResource = httpResource(
    () => {
      const id = this.#numericId();
      return Number.isFinite(id)
        ? {
            url: POKEAPI_GRAPHQL_URL,
            method: 'POST',
            body: { query: POKEMON_DETAIL_QUERY, variables: { id } },
          }
        : undefined;
    },
    { parse: parsePokemonDetail, defaultValue: EMPTY_DETAIL },
  );

  readonly #moveEffectsResource = httpResource<ReadonlyMap<string, string>>(
    () => {
      const slugs = this.#detailResource.value().moves.map(move => move.slug);
      return slugs.length > 0
        ? {
            url: POKEAPI_GRAPHQL_URL,
            method: 'POST',
            body: { query: MOVE_EFFECTS_QUERY, variables: { moves: slugs } },
          }
        : undefined;
    },
    { parse: parseMoveEffects, defaultValue: new Map<string, string>() },
  );

  protected readonly abilities = computed(() => this.#detailResource.value().abilities);
  protected readonly moves = computed<readonly PokemonMove[]>(() => {
    const effects = this.#moveEffectsResource.value();
    return this.#detailResource
      .value()
      .moves.map(move => ({ ...move, description: effects.get(move.slug) ?? move.description }));
  });
  protected readonly detailLoading = this.#detailResource.isLoading;

  protected add(id: number): void {
    this.store.add(id);
  }
}
