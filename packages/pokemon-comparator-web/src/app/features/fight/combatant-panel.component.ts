import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

import { SelectImports, SkeletonComponent } from '@justin-croyable/design-system';

import {
  type Combatant,
  DAMAGE_STAGE_STATS,
  stageLabel,
  STAT_STAGES,
} from '../../core/pokemon-damage';
import {
  EMPTY_DETAIL,
  POKEAPI_GRAPHQL_URL,
  POKEMON_DETAIL_QUERY,
  type PokemonMove,
  parsePokemonDetail,
} from '../../core/pokemon-detail';
import {
  LANG,
  type Pokemon,
  pokemonName,
  type Stat,
  STAT_META,
  STAT_ORDER,
} from '../../core/pokemon.model';
import { DEFAULT_ENHANCE_CONFIG, type EnhanceConfig, evsTotal, maxEvForStat, NEUTRAL_NATURE_ID } from '../../core/pokemon-stats';
import { normalizeText } from '../../core/pokemon-search';
import { EnhanceTargetPanelComponent, type EvChange } from '../enhance/enhance-target-panel.component';

interface PokemonOption {
  readonly value: string;
  readonly name: string;
  readonly searchText: string;
}

interface MoveOption {
  readonly slug: string;
  readonly name: string;
  readonly searchText: string;
}

interface StageControl {
  readonly stat: Stat;
  readonly label: string;
  readonly value: string;
}

const ZERO_STAGES: Readonly<Record<Stat, number>> = STAT_ORDER.reduce(
  (stages, stat) => ({ ...stages, [stat]: 0 }),
  {} as Record<Stat, number>,
);

@Component({
  selector: 'app-combatant-panel',
  imports: [SkeletonComponent, EnhanceTargetPanelComponent, ...SelectImports],
  template: `
    <div class="flex flex-col gap-5">
      <section class="flex flex-col gap-2">
        <h3 class="text-sm font-semibold">Pokémon</h3>
        <app-select
          withSearch
          class="w-full"
          placeholder="Choisir un Pokémon"
          searchPlaceholder="Rechercher un Pokémon"
          emptyText="Aucun Pokémon trouvé."
          [value]="selectedId()"
          (selectionChange)="onPokemonChange($event)"
        >
          @for (option of pokemonOptions(); track option.value) {
            <app-select-item [value]="option.value" [searchKeywords]="option.searchText">
              {{ option.name }}
            </app-select-item>
          }
        </app-select>
      </section>

      @if (hasPokemon()) {
        <section class="flex flex-col gap-2">
          <h3 class="text-sm font-semibold">Attaques</h3>
          @if (movesLoading()) {
            <app-skeleton class="h-9 w-full" />
          } @else {
            <app-select
              [multiple]="true"
              withSearch
              class="w-full"
              placeholder="Choisir des attaques"
              searchPlaceholder="Rechercher une attaque"
              emptyText="Aucune attaque trouvée."
              [maxLabelCount]="2"
              [value]="selectedMoveSlugs()"
              (selectionChange)="onMovesChange($event)"
            >
              @for (move of moveOptions(); track move.slug) {
                <app-select-item [value]="move.slug" [searchKeywords]="move.searchText">
                  {{ move.name }}
                </app-select-item>
              }
            </app-select>
          }
        </section>

        <section class="flex flex-col gap-2">
          <h3 class="text-sm font-semibold">Multiplicateurs de stats (buffs / réductions)</h3>
          <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
            @for (control of stageControls(); track control.stat) {
              <div class="flex flex-col gap-1">
                <span class="text-muted-foreground text-xs">{{ control.label }}</span>
                <app-select
                  class="w-full"
                  [value]="control.value"
                  (selectionChange)="onStageChange(control.stat, $event)"
                >
                  @for (option of stageOptions; track option.value) {
                    <app-select-item [value]="option.value">{{ option.label }}</app-select-item>
                  }
                </app-select>
              </div>
            }
          </div>
        </section>

        <section class="flex flex-col gap-2">
          <h3 class="text-sm font-semibold">Nature & EV</h3>
          <app-enhance-target-panel
            [nature]="config().nature"
            [evs]="config().evs"
            (natureChange)="onNatureChange($event)"
            (evChange)="onEvChange($event)"
          />
        </section>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CombatantPanelComponent {
  readonly pokemons = input.required<readonly Pokemon[]>();

  readonly #id = signal<number | null>(null);
  readonly #config = signal<EnhanceConfig>({
    level100: true,
    nature: NEUTRAL_NATURE_ID,
    evs: DEFAULT_ENHANCE_CONFIG.evs,
  });
  readonly #stages = signal<Readonly<Record<Stat, number>>>({ ...ZERO_STAGES });
  readonly #selectedMoveSlugs = signal<string[]>([]);

  protected readonly stageOptions = STAT_STAGES.map(stage => ({
    value: String(stage),
    label: stageLabel(stage),
  }));

  protected readonly selectedId = computed(() => {
    const id = this.#id();
    return id === null ? '' : String(id);
  });
  protected readonly config = this.#config.asReadonly();
  protected readonly selectedMoveSlugs = computed(() => [...this.#selectedMoveSlugs()]);

  protected readonly pokemonOptions = computed<readonly PokemonOption[]>(() =>
    this.pokemons().map(pokemon => {
      const name = pokemonName(pokemon, LANG.fr);
      return { value: String(pokemon.id), name, searchText: normalizeText(name) };
    }),
  );

  readonly #pokemon = computed(() => this.pokemons().find(pokemon => pokemon.id === this.#id()));
  protected readonly hasPokemon = computed(() => this.#pokemon() !== undefined);

  protected readonly stageControls = computed<readonly StageControl[]>(() => {
    const stages = this.#stages();
    return DAMAGE_STAGE_STATS.map(stat => ({
      stat,
      label: STAT_META[stat].short,
      value: String(stages[stat]),
    }));
  });

  readonly #movesResource = httpResource(
    () => {
      const id = this.#id();
      return id === null
        ? undefined
        : {
            url: POKEAPI_GRAPHQL_URL,
            method: 'POST',
            body: { query: POKEMON_DETAIL_QUERY, variables: { id } },
          };
    },
    { parse: parsePokemonDetail, defaultValue: EMPTY_DETAIL },
  );

  protected readonly movesLoading = this.#movesResource.isLoading;
  readonly #availableMoves = computed(() => this.#movesResource.value().moves);

  protected readonly moveOptions = computed<readonly MoveOption[]>(() =>
    this.#availableMoves().map(move => ({
      slug: move.slug,
      name: move.name,
      searchText: normalizeText(move.name),
    })),
  );

  readonly displayName = computed(() => {
    const pokemon = this.#pokemon();
    return pokemon ? pokemonName(pokemon, LANG.fr) : '';
  });

  readonly combatant = computed<Combatant | null>(() => {
    const pokemon = this.#pokemon();
    if (!pokemon) {
      return null;
    }
    return {
      types: pokemon.types,
      baseStats: pokemon.stats,
      config: this.#config(),
      stages: this.#stages(),
    };
  });

  readonly selectedMoves = computed<readonly PokemonMove[]>(() => {
    const selected = new Set(this.#selectedMoveSlugs());
    return this.#availableMoves().filter(move => selected.has(move.slug));
  });

  protected onPokemonChange(value: string | string[]): void {
    const raw = Array.isArray(value) ? (value[0] ?? '') : value;
    const id = raw ? Number(raw) : null;
    this.#id.set(id !== null && Number.isFinite(id) ? id : null);
    this.#selectedMoveSlugs.set([]);
  }

  protected onNatureChange(nature: string): void {
    this.#config.update(config => ({ ...config, nature }));
  }

  protected onEvChange(change: EvChange): void {
    this.#config.update(config => {
      const max = maxEvForStat(config.evs[change.stat], evsTotal(config.evs));
      const bounded = Math.max(0, Math.min(change.value, max));
      return { ...config, evs: { ...config.evs, [change.stat]: bounded } };
    });
  }

  protected onStageChange(stat: Stat, value: string | string[]): void {
    const raw = Array.isArray(value) ? (value[0] ?? '0') : value;
    const stage = Number(raw);
    this.#stages.update(stages => ({ ...stages, [stat]: Number.isFinite(stage) ? stage : 0 }));
  }

  protected onMovesChange(value: string | string[]): void {
    this.#selectedMoveSlugs.set(Array.isArray(value) ? value : [value]);
  }
}
