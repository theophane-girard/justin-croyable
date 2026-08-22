import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { of, switchMap, take, timer } from 'rxjs';

import {
  ButtonComponent,
  CardComponent,
  ChartComponent,
  EmptyComponent,
  podiumLabel,
  SegmentComponent,
  type SegmentItem,
  SelectImports,
} from '@justin-croyable/design-system';
import { NgIcon } from '@ng-icons/core';
import type { EChartsCoreOption } from 'echarts/core';

import {
  CROP_BY_ID,
  type CropId,
  cropUnit,
  HARVEST_UNIT_META,
  isCropId,
  matchesSeason,
  matchesYear,
  SEASON,
  SEASON_FILTER_ALL,
  SEASON_META,
  seasonForDate,
  type SeasonFilter,
  YEAR_ALL,
  type YearFilter,
} from '../../core/potager.model';
import { CatalogStore } from '../../core/catalog-store';
import { RankingStore } from '../../core/ranking-store';

type RankRow = { readonly gardenId: string; readonly label: string; readonly value: number };

type CultureOption = { readonly value: string; readonly label: string };

const CULTURE_ALL = 'all';

const SEASON_ITEMS: SegmentItem[] = [
  { value: SEASON_FILTER_ALL, label: 'Toutes' },
  { value: SEASON.summer, label: SEASON_META.summer.label, icon: SEASON_META.summer.icon },
  { value: SEASON.winter, label: SEASON_META.winter.label, icon: SEASON_META.winter.icon },
];

const YEAR_ALL_OPTION = { value: YEAR_ALL, label: 'Toutes années' };
const OFF_PODIUM = -1;

/**
 * En fin de course, les barres sont classées par valeur : on distingue le
 * podium sur les libellés, comme sur les classements figés.
 */
function racePodium(rows: readonly RankRow[]): readonly RankRow[] {
  const ranks = new Map(
    [...rows]
      .sort((left, right) => right.value - left.value)
      .map((row, rank) => [row.gardenId, rank] as const),
  );
  return rows.map(row => ({
    ...row,
    label: withPodiumPrefix(row.label, ranks.get(row.gardenId) ?? OFF_PODIUM, row.value),
  }));
}
const RACE_STEP_MS = 900;

/** Un jardin sans récolte ne monte pas sur le podium, même s'il ouvre la liste. */
function withPodiumPrefix(label: string, rank: number, value: number): string {
  return value > 0 ? podiumLabel(label, rank) : label;
}

function podiumRanked(rows: readonly RankRow[]): RankRow[] {
  return rows.map((row, rank) => ({ ...row, label: withPodiumPrefix(row.label, rank, row.value) }));
}

const DATE_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

@Component({
  selector: 'app-rankings',
  imports: [
    NgIcon,
    ButtonComponent,
    CardComponent,
    ChartComponent,
    EmptyComponent,
    SegmentComponent,
    ...SelectImports,
  ],
  template: `
    @if (ranking.entries().length === 0) {
      <app-empty
        icon="phosphorTrophy"
        title="Aucun jardin à classer"
        description="Les classements comparent les jardins auxquels vous avez accès."
      />
    } @else {
      <div class="flex flex-col gap-6">
        <app-card>
          <div class="flex flex-col gap-4">
            <div class="flex flex-wrap items-end justify-between gap-3">
              <div class="flex flex-col">
                <h3 class="text-foreground text-base font-semibold">
                  Meilleur rendement par plant
                </h3>
                <p class="text-muted-foreground text-sm">Récolté par plant, par jardin.</p>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <app-select
                  class="w-44"
                  prefixIcon="phosphorPlant"
                  [value]="activeCulture()"
                  (valueChange)="onCultureChange($event)"
                >
                  @for (option of cultureOptions(); track option.value) {
                    <app-select-item [value]="option.value">{{ option.label }}</app-select-item>
                  }
                </app-select>
                <app-select
                  class="w-36"
                  prefixIcon="phosphorCalendarBlank"
                  [value]="yearValue()"
                  (valueChange)="onYearChange($event)"
                >
                  @for (option of yearOptions(); track option.value) {
                    <app-select-item [value]="option.value">{{ option.label }}</app-select-item>
                  }
                </app-select>
              </div>
            </div>

            <app-segment
              class="self-start"
              variant="accent"
              [items]="seasonItems"
              [value]="season()"
              (valueChange)="onSeasonChange($event)"
            />

            @if (raceOpen()) {
              <p class="text-muted-foreground text-sm">Évolution au {{ raceCaption() }}</p>
              <app-chart [options]="raceChartOptions()" skeletonType="bar" height="20rem" />
            } @else {
              <app-chart [options]="yieldChartOptions()" skeletonType="bar" height="20rem" />
            }

            <div class="flex items-center gap-2">
              <button appButton variant="outline" size="sm" (click)="toggleRace()">
                <ng-icon
                  [name]="raceOpen() ? 'phosphorChartBar' : 'phosphorFilmSlate'"
                  class="size-4"
                />
                {{ raceOpen() ? 'Vue classement' : 'Course dans le temps' }}
              </button>
              @if (raceOpen()) {
                <button appButton variant="ghost" size="sm" (click)="replayRace()">
                  <ng-icon name="phosphorArrowClockwise" class="size-4" />
                  Rejouer
                </button>
              }
            </div>
          </div>
        </app-card>

        <app-card>
          <div class="flex flex-col gap-4">
            <div class="flex flex-col">
              <h3 class="text-foreground text-base font-semibold">
                Le plus de variétés différentes
              </h3>
              <p class="text-muted-foreground text-sm">Nombre de variétés cultivées par jardin.</p>
            </div>
            <app-chart [options]="varietyChartOptions()" skeletonType="bar" height="18rem" />
          </div>
        </app-card>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RankingsComponent {
  protected readonly ranking = inject(RankingStore);
  readonly #catalog = inject(CatalogStore);

  constructor() {
    void this.ranking.reload();
  }

  protected readonly seasonItems = SEASON_ITEMS;

  readonly #today = new Date();

  protected readonly selectedCulture = signal<string>(CULTURE_ALL);
  protected readonly season = signal<SeasonFilter>(seasonForDate(this.#today));
  protected readonly year = signal<YearFilter>(this.#today.getFullYear());
  protected readonly raceOpen = signal(false);
  protected readonly raceRun = signal(0);

  protected readonly cultureOptions = computed<CultureOption[]>(() => {
    const present = new Set<CropId>();
    this.ranking.entries().forEach(entry =>
      entry.plants.forEach(plant => {
        if (isCropId(plant.cropId)) {
          present.add(plant.cropId);
        }
      }),
    );
    const crops = Array.from(present)
      .map(cropId => ({ value: cropId as string, label: CROP_BY_ID[cropId].label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'fr'));
    return [{ value: CULTURE_ALL, label: 'Toutes les cultures' }, ...crops];
  });

  protected readonly activeCulture = computed<string>(() => {
    const selected = this.selectedCulture();
    if (selected === CULTURE_ALL || isCropId(selected)) {
      return selected;
    }
    return CULTURE_ALL;
  });

  protected readonly yearOptions = computed(() => {
    const years = new Set<number>([this.#today.getFullYear()]);
    this.ranking
      .entries()
      .forEach(entry =>
        entry.harvests.forEach(harvest => years.add(new Date(harvest.harvestedOn).getFullYear())),
      );
    const sorted = Array.from(years).sort((a, b) => b - a);
    return [
      YEAR_ALL_OPTION,
      ...sorted.map(value => ({ value: String(value), label: String(value) })),
    ];
  });

  protected readonly yearValue = computed(() => {
    const current = this.year();
    return current === YEAR_ALL ? YEAR_ALL : String(current);
  });

  protected readonly yieldUnitSuffix = computed(() => {
    const culture = this.activeCulture();
    return isCropId(culture) ? HARVEST_UNIT_META[cropUnit(culture)].quantitySuffix : '';
  });

  protected readonly yieldRows = computed<RankRow[]>(() => {
    const culture = this.activeCulture();
    return this.ranking
      .entries()
      .map(entry => ({
        gardenId: entry.gardenId,
        label: entry.gardenName,
        value: this.#yieldPerPlant(entry.gardenId, culture, Number.POSITIVE_INFINITY),
      }))
      .sort((a, b) => b.value - a.value);
  });

  protected readonly rankedYieldRows = computed<RankRow[]>(() => podiumRanked(this.yieldRows()));

  protected readonly varietyRows = computed<RankRow[]>(() =>
    podiumRanked(
      this.ranking
        .entries()
        .map(entry => {
          const keys = new Set<string>();
          entry.plants.forEach(plant => keys.add(plant.varietyId ?? `crop:${plant.cropId}`));
          return { gardenId: entry.gardenId, label: entry.gardenName, value: keys.size };
        })
        .sort((a, b) => b.value - a.value),
    ),
  );

  protected readonly yieldChartOptions = computed<EChartsCoreOption>(() =>
    this.#horizontalBar(this.rankedYieldRows(), this.yieldUnitSuffix()),
  );

  protected readonly varietyChartOptions = computed<EChartsCoreOption>(() =>
    this.#horizontalBar(this.varietyRows(), ''),
  );

  protected readonly raceSteps = computed<number[]>(() => {
    const culture = this.activeCulture();
    const timestamps = new Set<number>();
    this.ranking
      .entries()
      .forEach(entry =>
        this.#cultureHarvests(entry.gardenId, culture).forEach(timestamp =>
          timestamps.add(timestamp.at),
        ),
      );
    return Array.from(timestamps).sort((a, b) => a - b);
  });

  readonly #raceIndex = toSignal(
    toObservable(
      computed(() => ({
        run: this.raceRun(),
        open: this.raceOpen(),
        total: this.raceSteps().length,
      })),
    ).pipe(
      switchMap(({ open, total }) =>
        open && total > 0 ? timer(0, RACE_STEP_MS).pipe(take(total)) : of(-1),
      ),
    ),
    { initialValue: -1 },
  );

  /** La course est finie quand le pas de temps a atteint la dernière récolte. */
  protected readonly raceFinished = computed(() => {
    const total = this.raceSteps().length;
    return total > 0 && this.#raceIndex() >= total - 1;
  });

  protected readonly raceCaption = computed(() => {
    const steps = this.raceSteps();
    if (steps.length === 0) {
      return '—';
    }
    const index = Math.min(Math.max(this.#raceIndex(), 0), steps.length - 1);
    return DATE_FORMATTER.format(new Date(steps[index]));
  });

  protected readonly raceChartOptions = computed<EChartsCoreOption>(() => {
    const culture = this.activeCulture();
    const steps = this.raceSteps();
    if (steps.length === 0) {
      return this.#horizontalBar([], this.yieldUnitSuffix());
    }
    const index = Math.min(Math.max(this.#raceIndex(), 0), steps.length - 1);
    const cutoff = steps[index];
    const rows = this.ranking.entries().map(entry => ({
      gardenId: entry.gardenId,
      label: entry.gardenName,
      value: this.#yieldPerPlant(entry.gardenId, culture, cutoff),
    }));
    return this.#raceBar(this.raceFinished() ? racePodium(rows) : rows, this.yieldUnitSuffix());
  });

  protected onCultureChange(value: string | string[] | null): void {
    if (typeof value === 'string') {
      this.selectedCulture.set(value);
    }
  }

  protected onSeasonChange(value: string | null): void {
    if (value === SEASON_FILTER_ALL || value === SEASON.summer || value === SEASON.winter) {
      this.season.set(value);
    }
  }

  protected onYearChange(value: string | string[] | null): void {
    if (typeof value !== 'string') {
      return;
    }
    this.year.set(value === YEAR_ALL ? YEAR_ALL : Number.parseInt(value, 10));
  }

  protected toggleRace(): void {
    const next = !this.raceOpen();
    this.raceOpen.set(next);
    if (next) {
      this.raceRun.update(run => run + 1);
    }
  }

  protected replayRace(): void {
    this.raceRun.update(run => run + 1);
  }

  #cultureHarvests(gardenId: string, culture: string): readonly { at: number; weightKg: number }[] {
    const entry = this.ranking.entries().find(item => item.gardenId === gardenId);
    if (!entry) {
      return [];
    }
    const byId = this.#catalog.byId();
    const seasonFilter = this.season();
    const yearFilter = this.year();
    return entry.harvests
      .filter(harvest => culture === CULTURE_ALL || byId.get(harvest.varietyId)?.cropId === culture)
      .map(harvest => ({ date: new Date(harvest.harvestedOn), weightKg: harvest.weightKg }))
      .filter(
        item =>
          matchesSeason(seasonForDate(item.date), seasonFilter) &&
          matchesYear(item.date.getFullYear(), yearFilter),
      )
      .map(item => ({ at: item.date.getTime(), weightKg: item.weightKg }));
  }

  #totalPlants(gardenId: string, culture: string): number {
    const entry = this.ranking.entries().find(item => item.gardenId === gardenId);
    if (!entry) {
      return 0;
    }
    return entry.plants
      .filter(plant => culture === CULTURE_ALL || plant.cropId === culture)
      .reduce((total, plant) => total + plant.quantity, 0);
  }

  #yieldPerPlant(gardenId: string, culture: string, cutoff: number): number {
    const plants = this.#totalPlants(gardenId, culture);
    if (plants === 0) {
      return 0;
    }
    const weight = this.#cultureHarvests(gardenId, culture)
      .filter(harvest => harvest.at <= cutoff)
      .reduce((total, harvest) => total + harvest.weightKg, 0);
    return round(weight / plants);
  }

  #horizontalBar(rows: readonly RankRow[], suffix: string): EChartsCoreOption {
    const ordered = [...rows].reverse();
    return {
      grid: { left: 8, right: 48, top: 12, bottom: 8, containLabel: true },
      tooltip: { trigger: 'axis', valueFormatter: (value: number) => `${value} ${suffix}`.trim() },
      xAxis: { type: 'value' },
      yAxis: { type: 'category', data: ordered.map(row => row.label) },
      series: [
        {
          type: 'bar',
          data: ordered.map(row => row.value),
          label: {
            show: true,
            position: 'right',
            formatter: (params: { value: number }) => `${params.value} ${suffix}`.trim(),
          },
        },
      ],
    };
  }

  #raceBar(rows: readonly RankRow[], suffix: string): EChartsCoreOption {
    return {
      grid: { left: 8, right: 64, top: 12, bottom: 8, containLabel: true },
      xAxis: { type: 'value', max: 'dataMax' },
      yAxis: {
        type: 'category',
        data: rows.map(row => row.label),
        inverse: true,
        animationDuration: 300,
        animationDurationUpdate: 300,
      },
      series: [
        {
          type: 'bar',
          realtimeSort: true,
          data: rows.map(row => row.value),
          label: {
            show: true,
            position: 'right',
            valueAnimation: true,
            formatter: (params: { value: number }) => `${params.value} ${suffix}`.trim(),
          },
        },
      ],
      animationDuration: 0,
      animationDurationUpdate: RACE_STEP_MS,
      animationEasing: 'linear',
      animationEasingUpdate: 'linear',
    };
  }
}
