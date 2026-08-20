import { ChangeDetectionStrategy, Component, computed, inject, viewChild } from '@angular/core';

import {
  BadgeComponent,
  CardComponent,
  EmptyComponent,
  GenericSkeletonComponent,
} from '@justin-croyable/design-system';
import { NgIcon } from '@ng-icons/core';

import { ComparatorStore } from '../../core/comparator-store';
import { computeDamage, type DamageResult } from '../../core/pokemon-damage';
import { type PokemonMove } from '../../core/pokemon-detail';
import { typeLabel, typeTileClass } from '../../core/pokemon-type';
import { CombatantPanelComponent } from './combatant-panel.component';

interface DamageRow {
  readonly key: string;
  readonly moveName: string;
  readonly typeLabel: string;
  readonly typeClass: string;
  readonly stab: boolean;
  readonly status: boolean;
  readonly critical: boolean;
  readonly weatherBoosted: boolean;
  readonly weatherReduced: boolean;
  readonly burnReduced: boolean;
  readonly damageLabel: string;
  readonly percentLabel: string;
  readonly effectivenessLabel: string;
  readonly effectivenessClass: string;
}

const EFFECTIVE_CLASS = 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300';
const RESISTED_CLASS = 'bg-amber-500/15 text-amber-700 dark:text-amber-300';
const IMMUNE_CLASS = 'bg-slate-500/15 text-slate-700 dark:text-slate-300';
const NEUTRAL_CLASS = 'bg-slate-500/10 text-muted-foreground';

function effectivenessLabel(multiplier: number): string {
  if (multiplier === 0) {
    return 'Immunisé ×0';
  }
  if (multiplier === 0.25) {
    return '×¼';
  }
  if (multiplier === 0.5) {
    return '×½';
  }
  return `×${multiplier}`;
}

function effectivenessClass(multiplier: number): string {
  if (multiplier === 0) {
    return IMMUNE_CLASS;
  }
  if (multiplier > 1) {
    return EFFECTIVE_CLASS;
  }
  if (multiplier < 1) {
    return RESISTED_CLASS;
  }
  return NEUTRAL_CLASS;
}

function toRow(move: PokemonMove, damage: DamageResult | null): DamageRow {
  if (!damage) {
    return {
      key: move.slug,
      moveName: move.name,
      typeLabel: typeLabel(move.type),
      typeClass: typeTileClass(move.type),
      stab: false,
      status: true,
      critical: false,
      weatherBoosted: false,
      weatherReduced: false,
      burnReduced: false,
      damageLabel: '—',
      percentLabel: 'Attaque de statut',
      effectivenessLabel: '',
      effectivenessClass: NEUTRAL_CLASS,
    };
  }
  return {
    key: move.slug,
    moveName: move.name,
    typeLabel: typeLabel(move.type),
    typeClass: typeTileClass(move.type),
    stab: damage.stab,
    status: false,
    critical: damage.critical,
    weatherBoosted: damage.weatherBoosted,
    weatherReduced: damage.weatherReduced,
    burnReduced: damage.burnReduced,
    damageLabel: `${damage.minDamage} – ${damage.maxDamage}`,
    percentLabel: `${damage.minPercent} – ${damage.maxPercent}% des PV`,
    effectivenessLabel: effectivenessLabel(damage.effectiveness),
    effectivenessClass: effectivenessClass(damage.effectiveness),
  };
}

@Component({
  selector: 'app-fight-simulator',
  imports: [
    NgIcon,
    BadgeComponent,
    CardComponent,
    EmptyComponent,
    GenericSkeletonComponent,
    CombatantPanelComponent,
  ],
  template: `
    <div class="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header class="flex flex-col gap-1">
        <div class="flex items-center gap-2">
          <ng-icon name="phosphorSword" class="text-primary size-7 shrink-0" />
          <h1 class="text-2xl font-semibold tracking-tight">Simulateur de combat</h1>
        </div>
        <p class="text-muted-foreground text-sm">
          Choisissez deux Pokémon, leurs attaques, leur nature et leurs EV, puis ajustez les
          multiplicateurs de stats (buffs / réductions) pour estimer les dégâts au niveau 100 —
          STAB, faiblesses et résistances compris.
        </p>
      </header>

      @if (store.isLoading()) {
        <app-generic-skeleton />
      } @else if (store.hasError()) {
        <app-empty
          icon="phosphorWarningCircle"
          title="Impossible de charger les Pokémon"
          description="La récupération des données depuis l'API PokéAPI a échoué."
        />
      } @else {
        <div class="grid gap-4 md:grid-cols-2">
          <app-card title="Combattant A">
            <app-combatant-panel #a />
          </app-card>
          <app-card title="Combattant B">
            <app-combatant-panel #b />
          </app-card>
        </div>

        @if (ready()) {
          <div class="grid gap-4 md:grid-cols-2">
            <app-card [title]="titleAtoB()">
              @if (resultsAtoB().length === 0) {
                <p class="text-muted-foreground text-sm">
                  Sélectionnez des attaques pour {{ nameA() }}.
                </p>
              } @else {
                <div class="flex flex-col gap-2">
                  @for (row of resultsAtoB(); track row.key) {
                    <div class="border-border flex flex-col gap-1 rounded-lg border p-2">
                      <div class="flex flex-wrap items-center gap-2">
                        <span class="min-w-0 flex-1 truncate text-sm font-medium">
                          {{ row.moveName }}
                        </span>
                        <span [class]="row.typeClass" class="rounded-full px-2 py-0.5 text-xs font-medium">
                          {{ row.typeLabel }}
                        </span>
                        @if (row.stab) {
                          <app-badge type="secondary">STAB</app-badge>
                        }
                        @if (row.critical) {
                          <app-badge type="secondary">Crit ×1.5</app-badge>
                        }
                        @if (row.weatherBoosted) {
                          <app-badge type="secondary">Météo ×1.5</app-badge>
                        }
                        @if (row.weatherReduced) {
                          <app-badge type="secondary">Météo ×0.5</app-badge>
                        }
                        @if (row.burnReduced) {
                          <app-badge type="secondary">Brûlé ÷2</app-badge>
                        }
                        @if (row.effectivenessLabel) {
                          <span
                            [class]="row.effectivenessClass"
                            class="rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums"
                          >
                            {{ row.effectivenessLabel }}
                          </span>
                        }
                      </div>
                      <div class="flex items-baseline justify-between gap-2">
                        <span class="text-sm font-semibold tabular-nums">{{ row.damageLabel }}</span>
                        <span class="text-muted-foreground text-xs tabular-nums">
                          {{ row.percentLabel }}
                        </span>
                      </div>
                    </div>
                  }
                </div>
              }
            </app-card>

            <app-card [title]="titleBtoA()">
              @if (resultsBtoA().length === 0) {
                <p class="text-muted-foreground text-sm">
                  Sélectionnez des attaques pour {{ nameB() }}.
                </p>
              } @else {
                <div class="flex flex-col gap-2">
                  @for (row of resultsBtoA(); track row.key) {
                    <div class="border-border flex flex-col gap-1 rounded-lg border p-2">
                      <div class="flex flex-wrap items-center gap-2">
                        <span class="min-w-0 flex-1 truncate text-sm font-medium">
                          {{ row.moveName }}
                        </span>
                        <span [class]="row.typeClass" class="rounded-full px-2 py-0.5 text-xs font-medium">
                          {{ row.typeLabel }}
                        </span>
                        @if (row.stab) {
                          <app-badge type="secondary">STAB</app-badge>
                        }
                        @if (row.critical) {
                          <app-badge type="secondary">Crit ×1.5</app-badge>
                        }
                        @if (row.weatherBoosted) {
                          <app-badge type="secondary">Météo ×1.5</app-badge>
                        }
                        @if (row.weatherReduced) {
                          <app-badge type="secondary">Météo ×0.5</app-badge>
                        }
                        @if (row.burnReduced) {
                          <app-badge type="secondary">Brûlé ÷2</app-badge>
                        }
                        @if (row.effectivenessLabel) {
                          <span
                            [class]="row.effectivenessClass"
                            class="rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums"
                          >
                            {{ row.effectivenessLabel }}
                          </span>
                        }
                      </div>
                      <div class="flex items-baseline justify-between gap-2">
                        <span class="text-sm font-semibold tabular-nums">{{ row.damageLabel }}</span>
                        <span class="text-muted-foreground text-xs tabular-nums">
                          {{ row.percentLabel }}
                        </span>
                      </div>
                    </div>
                  }
                </div>
              }
            </app-card>
          </div>
        } @else {
          <app-empty
            icon="phosphorSword"
            title="En attente des deux Pokémon"
            description="Choisissez un Pokémon pour chaque combattant pour lancer la simulation."
          />
        }
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FightSimulatorComponent {
  protected readonly store = inject(ComparatorStore);

  private readonly panelA = viewChild('a', { read: CombatantPanelComponent });
  private readonly panelB = viewChild('b', { read: CombatantPanelComponent });

  protected readonly nameA = computed(() => this.panelA()?.displayName() ?? '');
  protected readonly nameB = computed(() => this.panelB()?.displayName() ?? '');

  protected readonly ready = computed(
    () => !!this.panelA()?.combatant() && !!this.panelB()?.combatant(),
  );

  protected readonly titleAtoB = computed(() => `${this.nameA()} attaque ${this.nameB()}`);
  protected readonly titleBtoA = computed(() => `${this.nameB()} attaque ${this.nameA()}`);

  protected readonly resultsAtoB = computed<readonly DamageRow[]>(() =>
    this.#results(this.panelA(), this.panelB()),
  );
  protected readonly resultsBtoA = computed<readonly DamageRow[]>(() =>
    this.#results(this.panelB(), this.panelA()),
  );

  #results(
    attackerPanel: CombatantPanelComponent | undefined,
    defenderPanel: CombatantPanelComponent | undefined,
  ): readonly DamageRow[] {
    const attacker = attackerPanel?.combatant();
    const defender = defenderPanel?.combatant();
    if (!attacker || !defender || !attackerPanel) {
      return [];
    }
    return attackerPanel.selectedMoves().map(move => toRow(move, computeDamage(attacker, defender, move)));
  }
}
