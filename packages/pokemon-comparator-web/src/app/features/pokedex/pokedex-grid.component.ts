import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

import {
  AvatarComponent,
  BadgeComponent,
  EmptyComponent,
  InputDirective,
} from '@justin-croyable/design-system';
import { NgIcon } from '@ng-icons/core';

import { searchPokemons } from '../../core/pokemon-search';
import { LANG, type Pokemon, pokemonImageUrl, pokemonName } from '../../core/pokemon.model';
import { typeLabels, typeTileClass } from '../../core/pokemon-type';

interface PokedexTile {
  readonly id: number;
  readonly name: string;
  readonly number: string;
  readonly imageUrl: string;
  readonly fallback: string;
  readonly tileClass: string;
  readonly types: readonly string[];
}

const TILE_BASE =
  'group/tile relative flex min-h-24 flex-col justify-between gap-2 overflow-hidden rounded-2xl p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50';

function toTile(pokemon: Pokemon): PokedexTile {
  const name = pokemonName(pokemon, LANG.fr);
  return {
    id: pokemon.id,
    name,
    number: pokemon.id < 10000 ? `Nº${pokemon.id}` : '',
    imageUrl: pokemonImageUrl(pokemon.id),
    fallback: name.charAt(0),
    tileClass: `${TILE_BASE} ${typeTileClass(pokemon.types[0])}`,
    types: typeLabels(pokemon.types),
  };
}

@Component({
  selector: 'app-pokedex-grid',
  imports: [NgIcon, AvatarComponent, BadgeComponent, EmptyComponent, InputDirective],
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
          description="Essayez un autre nom (fr, en, de, ja) ou « mega »."
        />
      } @else {
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4" [class]="scrollClass()">
          @for (item of tiles(); track item.id) {
            <button
              type="button"
              [class]="item.tileClass"
              [disabled]="disabledPicking()"
              (click)="select.emit(item.id)"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="flex min-w-0 flex-col">
                  <span class="truncate text-sm font-semibold leading-tight">{{ item.name }}</span>
                  @if (item.number) {
                    <span class="text-xs opacity-80">{{ item.number }}</span>
                  }
                </div>
                <app-avatar
                  class="size-12 shrink-0"
                  [src]="item.imageUrl"
                  [alt]="item.name"
                  [fallback]="item.fallback"
                />
              </div>
              <div class="flex flex-wrap gap-1">
                @for (type of item.types; track type) {
                  <app-badge type="secondary">{{ type }}</app-badge>
                }
              </div>
            </button>
          }
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokedexGridComponent {
  readonly pokemons = input.required<readonly Pokemon[]>();
  readonly excludedIds = input<ReadonlySet<number>>(new Set<number>());
  readonly limit = input<number>(120);
  readonly scrollClass = input<string>('');
  readonly disabledPicking = input<boolean>(false);
  readonly disabledHint = input<string>('');

  readonly select = output<number>();

  readonly #query = signal('');
  protected readonly query = this.#query.asReadonly();

  protected readonly tiles = computed<readonly PokedexTile[]>(() => {
    const query = this.#query();
    const excluded = this.excludedIds();
    const source = query.trim()
      ? searchPokemons(this.pokemons(), query, excluded).map(match => match.pokemon)
      : this.pokemons().filter(pokemon => !excluded.has(pokemon.id));
    return source.slice(0, this.limit()).map(toTile);
  });

  protected onSearchInput(event: Event): void {
    this.#query.set((event.target as HTMLInputElement).value);
  }
}
