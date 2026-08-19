import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { ButtonComponent, EmptyComponent, GridSkeletonComponent } from '@justin-croyable/design-system';
import { NgIcon } from '@ng-icons/core';

import { ComparatorStore } from '../../core/comparator-store';
import { APP_PATHS } from '../../app.routes';
import { PokedexGridComponent } from './pokedex-grid.component';

@Component({
  selector: 'app-pokedex',
  imports: [NgIcon, ButtonComponent, EmptyComponent, GridSkeletonComponent, PokedexGridComponent],
  template: `
    <div class="mx-auto flex h-full w-full max-w-5xl flex-col gap-6">
      <header class="flex flex-col gap-1">
        <div class="flex items-center gap-2">
          <ng-icon name="phosphorSquaresFour" class="text-primary size-7 shrink-0" />
          <h1 class="text-2xl font-semibold tracking-tight">Pokédex</h1>
        </div>
        <p class="text-muted-foreground text-sm">
          Parcourez les Pokémon, filtrez et triez (bouton en bas à droite), puis ouvrez un Pokémon
          pour son détail.
        </p>
      </header>

      @if (store.isLoading()) {
        <app-grid-skeleton class="min-h-0 flex-1" [tileCount]="18" />
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
        <app-pokedex-grid
          class="min-h-0 flex-1"
          viewportClass="h-[calc(100dvh-13rem)]"
          [pokemons]="store.pokemons()"
          [abilities]="store.abilities()"
          [moves]="store.moves()"
          [syncUrl]="true"
          (select)="openDetail($event)"
        />
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokedexComponent {
  protected readonly store = inject(ComparatorStore);
  readonly #router = inject(Router);

  protected openDetail(id: number): void {
    this.#router.navigate([`/${APP_PATHS.pokedex}`, id], { queryParamsHandling: 'preserve' });
  }

  protected reload(): void {
    this.store.reload();
  }
}
