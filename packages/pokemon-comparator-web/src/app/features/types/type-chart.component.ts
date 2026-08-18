import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

import {
  CardComponent,
  SegmentComponent,
  type SegmentItem,
  ToggleGroupComponent,
  type ToggleGroupItem,
} from '@justin-croyable/design-system';
import { NgIcon } from '@ng-icons/core';

import {
  defensiveMatchups,
  offensiveMatchups,
  type TypeMatchup,
  typeLabel,
  typeTileClass,
  TYPE_SLUGS,
} from '../../core/pokemon-type';

const MODE = { defense: 'defense', attack: 'attack' } as const;
type Mode = (typeof MODE)[keyof typeof MODE];

const MODE_ITEMS: readonly SegmentItem[] = [
  { value: MODE.defense, label: 'Défense', icon: 'phosphorShield' },
  { value: MODE.attack, label: 'Attaque', icon: 'phosphorSword' },
];

const TYPE_ITEMS: ToggleGroupItem[] = TYPE_SLUGS.map(slug => ({
  value: slug,
  label: typeLabel(slug),
}));

interface Bucket {
  readonly key: string;
  readonly value: number;
  readonly label: string;
}

const DEFENSE_BUCKETS: readonly Bucket[] = [
  { key: 'x4', value: 4, label: 'Double faiblesse ×4' },
  { key: 'x2', value: 2, label: 'Faiblesse ×2' },
  { key: 'x1', value: 1, label: 'Neutre ×1' },
  { key: 'x0_5', value: 0.5, label: 'Résistance ×½' },
  { key: 'x0_25', value: 0.25, label: 'Double résistance ×¼' },
  { key: 'x0', value: 0, label: 'Immunité ×0' },
];

const ATTACK_BUCKETS: readonly Bucket[] = [
  { key: 'x2', value: 2, label: 'Super efficace ×2' },
  { key: 'x1', value: 1, label: 'Neutre ×1' },
  { key: 'x0_5', value: 0.5, label: 'Peu efficace ×½' },
  { key: 'x0', value: 0, label: 'Sans effet ×0' },
];

interface MatchupGroup {
  readonly key: string;
  readonly label: string;
  readonly matchups: readonly TypeMatchup[];
}

function bucketize(
  matchups: readonly TypeMatchup[],
  buckets: readonly Bucket[],
): readonly MatchupGroup[] {
  return buckets
    .map(bucket => ({
      key: bucket.key,
      label: bucket.label,
      matchups: matchups.filter(matchup => matchup.multiplier === bucket.value),
    }))
    .filter(group => group.matchups.length > 0);
}

@Component({
  selector: 'app-type-chart',
  imports: [NgIcon, CardComponent, SegmentComponent, ToggleGroupComponent],
  template: `
    <div class="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header class="flex flex-col gap-1">
        <div class="flex items-center gap-2">
          <ng-icon name="phosphorShield" class="text-primary size-7 shrink-0" />
          <h1 class="text-2xl font-semibold tracking-tight">Types & Faiblesses</h1>
        </div>
        <p class="text-muted-foreground text-sm">
          Sélectionnez un type pour voir les multiplicateurs de dégâts, en défense comme en attaque.
        </p>
      </header>

      <app-card>
        <div class="flex flex-col gap-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h2 class="text-lg font-semibold">Type</h2>
            <app-segment
              variant="accent"
              [items]="modeItems"
              [value]="mode()"
              (valueChange)="onModeChange($event)"
            />
          </div>
          <app-toggle-group
            mode="single"
            class="flex-wrap justify-start"
            [items]="typeItems"
            [value]="selectedType()"
            (valueChange)="onTypeChange($event)"
          />
        </div>
      </app-card>

      @if (selectedType()) {
        <app-card>
          <div class="flex flex-col gap-5">
            <div class="flex flex-wrap items-center gap-2">
              <span
                [class]="selectedTile().tileClass"
                class="rounded-full px-2.5 py-0.5 text-sm font-semibold"
              >
                {{ selectedTile().label }}
              </span>
              <span class="text-muted-foreground text-sm">{{ caption() }}</span>
            </div>

            <div class="flex flex-col gap-4">
              @for (group of groups(); track group.key) {
                <section class="flex flex-col gap-2">
                  <h3 class="text-foreground text-sm font-semibold">{{ group.label }}</h3>
                  <div class="flex flex-wrap gap-2">
                    @for (matchup of group.matchups; track matchup.type) {
                      <span
                        [class]="matchup.tileClass"
                        class="rounded-full px-2.5 py-0.5 text-xs font-medium"
                      >
                        {{ matchup.label }}
                      </span>
                    }
                  </div>
                </section>
              }
            </div>
          </div>
        </app-card>
      } @else {
        <p class="text-muted-foreground text-sm">Sélectionnez un type ci-dessus.</p>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TypeChartComponent {
  protected readonly typeItems = TYPE_ITEMS;
  protected readonly modeItems = MODE_ITEMS;

  protected readonly selectedType = signal<string>(TYPE_SLUGS[0]);
  protected readonly mode = signal<Mode>(MODE.defense);

  protected readonly selectedTile = computed(() => ({
    label: typeLabel(this.selectedType()),
    tileClass: typeTileClass(this.selectedType()),
  }));

  protected readonly groups = computed<readonly MatchupGroup[]>(() =>
    this.mode() === MODE.defense
      ? bucketize(defensiveMatchups([this.selectedType()]), DEFENSE_BUCKETS)
      : bucketize(offensiveMatchups(this.selectedType()), ATTACK_BUCKETS),
  );

  protected readonly caption = computed(() =>
    this.mode() === MODE.defense
      ? 'Dégâts subis selon le type de l’attaque.'
      : 'Efficacité de ce type quand il attaque.',
  );

  protected onTypeChange(value: string | string[]): void {
    this.selectedType.set(Array.isArray(value) ? (value[0] ?? '') : value);
  }

  protected onModeChange(value: string): void {
    this.mode.set(value === MODE.attack ? MODE.attack : MODE.defense);
  }
}
