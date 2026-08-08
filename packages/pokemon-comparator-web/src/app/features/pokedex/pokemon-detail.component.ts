import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  AvatarComponent,
  BadgeComponent,
  ButtonComponent,
  CardComponent,
  EmptyComponent,
  ProgressComponent,
} from '@justin-croyable/design-system';
import { NgIcon } from '@ng-icons/core';

import { ComparatorStore } from '../../core/comparator-store';
import { APP_PATHS } from '../../app.routes';
import {
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
import { typeLabels } from '../../core/pokemon-type';

interface NameRow {
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
  readonly fallback: string;
  readonly types: readonly string[];
  readonly names: readonly NameRow[];
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
    fallback: name.charAt(0),
    types: typeLabels(pokemon.types),
    names: pokemon.names.map(entry => ({ label: LANG_LABEL[entry.lang], value: entry.value })),
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
    AvatarComponent,
    BadgeComponent,
    ButtonComponent,
    CardComponent,
    EmptyComponent,
    ProgressComponent,
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
        <app-card>
          <div class="flex flex-col gap-6">
            <div class="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-5">
              <app-avatar
                size="lg"
                class="size-28 shrink-0"
                [src]="view.imageUrl"
                [alt]="view.name"
                [fallback]="view.fallback"
              />
              <div class="flex flex-col items-center gap-2 sm:items-start">
                <span class="text-muted-foreground text-sm">{{ view.number }}</span>
                <h2 class="text-2xl font-semibold tracking-tight">{{ view.name }}</h2>
                <div class="flex flex-wrap justify-center gap-1 sm:justify-start">
                  @for (type of view.types; track type) {
                    <app-badge type="secondary">{{ type }}</app-badge>
                  }
                </div>
              </div>
              <div class="sm:ml-auto">
                @if (isSelected()) {
                  <button appButton type="button" variant="secondary" [buttonDisabled]="true">
                    <ng-icon name="phosphorCheck" class="size-4" />
                    Ajouté
                  </button>
                } @else {
                  <button
                    appButton
                    type="button"
                    [buttonDisabled]="store.isFull()"
                    (click)="add(view.id)"
                  >
                    <ng-icon name="phosphorPlus" class="size-4" />
                    Comparer
                  </button>
                }
              </div>
            </div>

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
              <div class="flex items-center justify-between">
                <h3 class="text-foreground text-sm font-semibold">Statistiques de base</h3>
                <span class="text-muted-foreground text-sm">Total {{ view.total }}</span>
              </div>
              <div class="flex flex-col gap-2">
                @for (row of view.stats; track row.key) {
                  <div class="flex items-center gap-3">
                    <span class="text-muted-foreground w-28 shrink-0 text-sm">{{ row.label }}</span>
                    <app-progress class="h-2.5 flex-1" [value]="row.percent" />
                    <span class="w-10 shrink-0 text-right text-sm font-medium tabular-nums">
                      {{ row.value }}
                    </span>
                  </div>
                }
              </div>
            </section>
          </div>
        </app-card>
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
