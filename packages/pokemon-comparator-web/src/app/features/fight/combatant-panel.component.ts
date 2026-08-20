import { httpResource } from '@angular/common/http';
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

import {
  ButtonComponent,
  SelectImports,
  SheetService,
  ToggleGroupComponent,
  type ToggleGroupItem,
} from '@justin-croyable/design-system';
import { NgIcon } from '@ng-icons/core';

import { ComparatorStore } from '../../core/comparator-store';
import {
  type Combatant,
  DAMAGE_STAGE_STATS,
  stageLabel,
  STAT_STAGES,
  type Weather,
  WEATHER,
  WEATHER_OPTIONS,
  toWeather,
} from '../../core/pokemon-damage';
import {
  EMPTY_DETAIL,
  MOVE_EFFECTS_QUERY,
  type MoveEffectInfo,
  POKEAPI_GRAPHQL_URL,
  POKEMON_DETAIL_QUERY,
  type PokemonMove,
  parseMoveEffects,
  parsePokemonDetail,
} from '../../core/pokemon-detail';
import { LANG, pokemonImageUrl, pokemonName, type Stat, STAT_META } from '../../core/pokemon.model';
import {
  DEFAULT_ENHANCE_CONFIG,
  type EnhanceConfig,
  evsTotal,
  maxEvForStat,
  NEUTRAL_NATURE_ID,
} from '../../core/pokemon-stats';
import { EnhanceTargetPanelComponent, type EvChange } from '../enhance/enhance-target-panel.component';
import { PokedexGridComponent } from '../pokedex/pokedex-grid.component';
import { PokemonDetailComponent } from '../pokedex/pokemon-detail.component';
import { PokemonMovesComponent } from '../pokedex/pokemon-moves.component';
import { PokemonSpriteComponent } from '../pokedex/pokemon-sprite.component';

interface StageControl {
  readonly stat: Stat;
  readonly label: string;
  readonly value: string;
}

const CONDITION = { critical: 'critical', burn: 'burn' } as const;

const ZERO_STAGES: Readonly<Record<Stat, number>> = DAMAGE_STAGE_STATS.reduce(
  (stages, stat) => ({ ...stages, [stat]: 0 }),
  {} as Record<Stat, number>,
);

@Component({
  selector: 'app-combatant-panel',
  imports: [
    NgIcon,
    ButtonComponent,
    EnhanceTargetPanelComponent,
    PokedexGridComponent,
    PokemonDetailComponent,
    PokemonMovesComponent,
    PokemonSpriteComponent,
    ToggleGroupComponent,
    ...SelectImports,
  ],
  template: `
    <div class="flex flex-col gap-5">
      <section class="flex flex-col gap-2">
        <h3 class="text-sm font-semibold">Pokémon</h3>
        @if (hasPokemon()) {
          <div class="border-border flex items-center gap-3 rounded-lg border p-2">
            <app-pokemon-sprite class="size-12" [src]="spriteUrl()" [alt]="displayName()" />
            <span class="min-w-0 flex-1 truncate text-sm font-medium">{{ displayName() }}</span>
            <button
              appButton
              type="button"
              variant="ghost"
              size="sm"
              aria-label="Détail du Pokémon"
              (click)="openDetail()"
            >
              <ng-icon name="phosphorInfo" class="size-5" />
            </button>
            <button appButton type="button" variant="outline" size="sm" (click)="openPokedex()">
              <ng-icon name="phosphorArrowClockwise" class="size-4" />
              Changer
            </button>
          </div>
        } @else {
          <button appButton type="button" variant="outline" full (click)="openPokedex()">
            <ng-icon name="phosphorMagnifyingGlass" class="size-4" />
            Choisir un Pokémon
          </button>
        }
      </section>

      @if (hasPokemon()) {
        <section class="flex flex-col gap-2">
          <h3 class="text-sm font-semibold">Attaques</h3>
          <button appButton type="button" variant="outline" full (click)="openMoves()">
            <ng-icon name="phosphorSword" class="size-4" />
            {{ movesButtonLabel() }}
          </button>
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
          <h3 class="text-sm font-semibold">Conditions de combat</h3>
          <app-toggle-group
            mode="multiple"
            class="flex-wrap justify-start"
            [items]="conditionItems"
            [value]="conditionValue()"
            (valueChange)="onConditionsChange($event)"
          />
          <div class="flex flex-col gap-1">
            <span class="text-muted-foreground text-xs">Météo</span>
            <app-toggle-group
              mode="single"
              class="flex-wrap justify-start"
              [items]="weatherItems"
              [value]="weather()"
              (valueChange)="onWeatherChange($event)"
            />
          </div>
        </section>

        <section class="flex flex-col gap-2">
          <h3 class="text-sm font-semibold">Nature & EV</h3>
          <app-enhance-target-panel
            [nature]="config().nature"
            [evs]="config().evs"
            [displayStats]="true"
            [baseStats]="pokemonStats()"
            (natureChange)="onNatureChange($event)"
            (evChange)="onEvChange($event)"
          />
        </section>
      }
    </div>

    <ng-template #pokedexSheet>
      <app-pokedex-grid
        [pokemons]="store.pokemons()"
        [abilities]="store.abilities()"
        [moves]="store.moves()"
        viewportClass="h-[calc(100dvh-9rem)]"
        (select)="onPickPokemon($event)"
      />
    </ng-template>

    <ng-template #detailSheet>
      <app-pokemon-detail [id]="pokemonIdString()" [embedded]="true" />
    </ng-template>

    <ng-template #movesSheet>
      <app-pokemon-moves
        [selectable]="true"
        viewportClass="h-[calc(100dvh-13rem)]"
        [moves]="availableMoves()"
        [loading]="movesLoading()"
        [selected]="selectedMoveSlugs()"
        (selectedChange)="onMovesChange($event)"
      />
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CombatantPanelComponent {
  protected readonly store = inject(ComparatorStore);
  readonly #sheet = inject(SheetService);
  readonly #viewContainerRef = inject(ViewContainerRef);

  private readonly pokedexTemplate = viewChild.required<TemplateRef<unknown>>('pokedexSheet');
  private readonly detailTemplate = viewChild.required<TemplateRef<unknown>>('detailSheet');
  private readonly movesTemplate = viewChild.required<TemplateRef<unknown>>('movesSheet');
  #sheetRef: { close: () => void } | undefined;

  readonly #id = signal<number | null>(null);
  readonly #config = signal<EnhanceConfig>({
    level100: true,
    nature: NEUTRAL_NATURE_ID,
    evs: DEFAULT_ENHANCE_CONFIG.evs,
  });
  readonly #stages = signal<Readonly<Record<Stat, number>>>({ ...ZERO_STAGES });
  readonly #selectedMoveSlugs = signal<string[]>([]);
  readonly #critical = signal(false);
  readonly #burned = signal(false);
  readonly #weather = signal<Weather>(WEATHER.none);

  protected readonly stageOptions = STAT_STAGES.map(stage => ({
    value: String(stage),
    label: stageLabel(stage),
  }));

  protected readonly conditionItems: readonly ToggleGroupItem[] = [
    { value: CONDITION.critical, label: 'Coup critique' },
    { value: CONDITION.burn, label: 'Brûlure (attaquant)' },
  ];
  protected readonly weatherItems: readonly ToggleGroupItem[] = WEATHER_OPTIONS.map(option => ({
    value: option.value,
    label: option.label,
  }));

  protected readonly weather = this.#weather.asReadonly();
  protected readonly conditionValue = computed<string[]>(() => {
    const active: string[] = [];
    if (this.#critical()) {
      active.push(CONDITION.critical);
    }
    if (this.#burned()) {
      active.push(CONDITION.burn);
    }
    return active;
  });

  protected readonly config = this.#config.asReadonly();
  protected readonly selectedMoveSlugs = computed(() => [...this.#selectedMoveSlugs()]);
  protected readonly movesButtonLabel = computed(() => {
    const count = this.#selectedMoveSlugs().length;
    return count > 0 ? `Attaques (${count})` : 'Choisir des attaques';
  });

  readonly #pokemon = computed(() =>
    this.store.pokemons().find(pokemon => pokemon.id === this.#id()),
  );
  protected readonly hasPokemon = computed(() => this.#pokemon() !== undefined);
  protected readonly pokemonStats = computed<Readonly<Record<Stat, number>> | null>(
    () => this.#pokemon()?.stats ?? null,
  );
  protected readonly pokemonIdString = computed(() => {
    const id = this.#id();
    return id === null ? '' : String(id);
  });
  protected readonly spriteUrl = computed(() => {
    const id = this.#id();
    return id === null ? '' : pokemonImageUrl(id);
  });

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

  readonly #moveEffectsResource = httpResource<ReadonlyMap<string, MoveEffectInfo>>(
    () => {
      const slugs = this.#movesResource.value().moves.map(move => move.slug);
      return slugs.length === 0
        ? undefined
        : {
            url: POKEAPI_GRAPHQL_URL,
            method: 'POST',
            body: { query: MOVE_EFFECTS_QUERY, variables: { moves: slugs } },
          };
    },
    { parse: parseMoveEffects, defaultValue: new Map<string, MoveEffectInfo>() },
  );

  protected readonly movesLoading = this.#movesResource.isLoading;
  protected readonly availableMoves = computed<readonly PokemonMove[]>(() => {
    const effects = this.#moveEffectsResource.value();
    return this.#movesResource.value().moves.map(move => {
      const info = effects.get(move.slug);
      return {
        ...move,
        description: info?.flavor || move.description,
        effect: info?.effect || move.effect,
      };
    });
  });

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
      critical: this.#critical(),
      burned: this.#burned(),
      weather: this.#weather(),
    };
  });

  readonly selectedMoves = computed<readonly PokemonMove[]>(() => {
    const selected = new Set(this.#selectedMoveSlugs());
    return this.availableMoves().filter(move => selected.has(move.slug));
  });

  protected openPokedex(): void {
    this.#sheetRef = this.#sheet.create({
      content: this.pokedexTemplate(),
      side: 'bottom',
      title: 'Choisir un Pokémon',
      height: '100dvh',
      hideFooter: true,
      maskClosable: true,
      viewContainerRef: this.#viewContainerRef,
      customClasses: 'p-4',
    });
  }

  protected onPickPokemon(id: number): void {
    this.#id.set(id);
    this.#selectedMoveSlugs.set([]);
    this.#sheetRef?.close();
  }

  protected openDetail(): void {
    this.#sheet.create({
      content: this.detailTemplate(),
      side: 'bottom',
      title: this.displayName(),
      height: '100dvh',
      hideFooter: true,
      maskClosable: true,
      viewContainerRef: this.#viewContainerRef,
      customClasses: 'p-4',
    });
  }

  protected openMoves(): void {
    this.#sheet.create({
      content: this.movesTemplate(),
      side: 'bottom',
      title: 'Choisir les attaques',
      height: '100dvh',
      hideFooter: true,
      maskClosable: true,
      viewContainerRef: this.#viewContainerRef,
      customClasses: 'p-4',
    });
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

  protected onConditionsChange(value: string | string[]): void {
    const active = new Set(Array.isArray(value) ? value : [value]);
    this.#critical.set(active.has(CONDITION.critical));
    this.#burned.set(active.has(CONDITION.burn));
  }

  protected onWeatherChange(value: string | string[]): void {
    const raw = Array.isArray(value) ? (value[0] ?? WEATHER.none) : value;
    this.#weather.set(toWeather(raw));
  }

  protected onStageChange(stat: Stat, value: string | string[]): void {
    const raw = Array.isArray(value) ? (value[0] ?? '0') : value;
    const stage = Number(raw);
    this.#stages.update(stages => ({ ...stages, [stat]: Number.isFinite(stage) ? stage : 0 }));
  }

  protected onMovesChange(slugs: string[]): void {
    this.#selectedMoveSlugs.set(slugs);
  }
}
