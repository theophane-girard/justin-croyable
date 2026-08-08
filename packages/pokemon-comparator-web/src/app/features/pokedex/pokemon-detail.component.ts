import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  BadgeComponent,
  ButtonComponent,
  EmptyComponent,
  ProgressComponent,
  TabComponent,
  TabGroupComponent,
} from '@justin-croyable/design-system';
import { NgIcon } from '@ng-icons/core';

import { ComparatorStore } from '../../core/comparator-store';
import { APP_PATHS } from '../../app.routes';
import {
  EVOLUTION_STAGE_LABEL,
  LANG,
  LANG_LABEL,
  MAX_BASE_STAT,
  type Pokemon,
  pokemonImageUrl,
  pokemonName,
  pokemonTotal,
  STAT_META,
  STAT_ORDER,
} from '../../core/pokemon.model';
import { typeBarClass, typeLabels, typeTileClass } from '../../core/pokemon-type';

interface NameRow {
  readonly label: string;
  readonly value: string;
}

interface InfoRow {
  readonly label: string;
  readonly value: string;
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
  readonly names: readonly NameRow[];
  readonly info: readonly InfoRow[];
  readonly stats: readonly StatRow[];
  readonly total: number;
}

function toDetail(pokemon: Pokemon): DetailView {
  const name = pokemonName(pokemon, LANG.fr);
  return {
    id: pokemon.id,
    name,
    number: pokemon.id < 10000 ? `Nº${pokemon.id}` : 'Forme spéciale',
    imageUrl: pokemonImageUrl(pokemon.id),
    headerClass: typeTileClass(pokemon.types[0]),
    barClass: typeBarClass(pokemon.types[0]),
    types: typeLabels(pokemon.types),
    names: pokemon.names.map(entry => ({ label: LANG_LABEL[entry.lang], value: entry.value })),
    info: [
      { label: 'Stade', value: EVOLUTION_STAGE_LABEL[pokemon.stage] },
      { label: 'Catégorie', value: pokemon.legendary ? 'Légendaire' : 'Ordinaire' },
      { label: 'Total', value: `${pokemonTotal(pokemon)}` },
    ],
    stats: STAT_ORDER.map(stat => ({
      key: stat,
      label: STAT_META[stat].label,
      value: pokemon.stats[stat],
      percent: Math.round((pokemon.stats[stat] / MAX_BASE_STAT) * 100),
    })),
    total: pokemonTotal(pokemon),
  };
}

@Component({
  selector: 'app-pokemon-detail',
  imports: [
    RouterLink,
    NgIcon,
    BadgeComponent,
    ButtonComponent,
    EmptyComponent,
    ProgressComponent,
    TabGroupComponent,
    TabComponent,
  ],
  template: `
    <div class="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <a appButton type="button" variant="ghost" size="sm" class="w-fit" [routerLink]="pokedexLink">
        <ng-icon name="phosphorArrowLeft" class="size-4" />
        Retour au Pokédex
      </a>

      @let view = detail();
      @if (!view) {
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
              <app-tab label="À propos">
                <div class="flex flex-col gap-5 pt-4">
                  <section class="flex flex-col gap-2">
                    <h3 class="text-foreground text-sm font-semibold">Noms</h3>
                    <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      @for (row of view.names; track row.label) {
                        <div class="border-border flex flex-col rounded-lg border p-2">
                          <span class="text-muted-foreground text-xs">{{ row.label }}</span>
                          <span class="text-sm font-medium">{{ row.value }}</span>
                        </div>
                      }
                    </div>
                  </section>

                  <section class="flex flex-col gap-2">
                    <h3 class="text-foreground text-sm font-semibold">Informations</h3>
                    <div class="grid grid-cols-3 gap-2">
                      @for (row of view.info; track row.label) {
                        <div class="border-border flex flex-col rounded-lg border p-2">
                          <span class="text-muted-foreground text-xs">{{ row.label }}</span>
                          <span class="text-sm font-medium">{{ row.value }}</span>
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

              <app-tab label="Statistiques">
                <div class="flex flex-col gap-2 pt-4">
                  <div class="text-muted-foreground flex items-center justify-end text-sm">
                    Total {{ view.total }}
                  </div>
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
              </app-tab>
            </app-tab-group>
          </div>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonDetailComponent {
  protected readonly store = inject(ComparatorStore);

  readonly id = input.required<string>();

  protected readonly pokedexLink = `/${APP_PATHS.pokedex}`;

  readonly #numericId = computed(() => Number(this.id()));

  protected readonly detail = computed<DetailView | undefined>(() => {
    const id = this.#numericId();
    const pokemon = this.store.pokemons().find(entry => entry.id === id);
    return pokemon ? toDetail(pokemon) : undefined;
  });

  protected readonly isSelected = computed(() => this.store.selectedIdSet().has(this.#numericId()));

  protected add(id: number): void {
    this.store.add(id);
  }
}
