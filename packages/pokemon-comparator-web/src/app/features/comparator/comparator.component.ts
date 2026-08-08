import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  type TemplateRef,
  ViewContainerRef,
  viewChild,
} from '@angular/core';

import {
  ButtonComponent,
  CardComponent,
  ChartComponent,
  ChipComponent,
  EmptyComponent,
  ProgressComponent,
  SegmentComponent,
  type SegmentItem,
  SheetService,
  SpinnerComponent,
  ThemePaletteService,
} from '@justin-croyable/design-system';
import { NgIcon } from '@ng-icons/core';
import type { EChartsCoreOption } from 'echarts/core';

import { ComparatorStore, DISPLAY_MODE } from '../../core/comparator-store';
import { PokedexGridComponent } from '../pokedex/pokedex-grid.component';
import {
  LANG,
  MAX_BASE_STAT,
  pokemonImageUrl,
  pokemonName,
  pokemonTotal,
  STAT_META,
  STAT_ORDER,
} from '../../core/pokemon.model';

interface SelectedView {
  readonly id: number;
  readonly name: string;
  readonly totalLabel: string;
  readonly imageUrl: string;
  readonly mediaClass: string;
}

interface StatRow {
  readonly id: number;
  readonly name: string;
  readonly value: number;
  readonly percent: number;
  readonly barClass: string;
}

interface StatGroup {
  readonly key: string;
  readonly label: string;
  readonly rows: readonly StatRow[];
}

const MEDIA_BORDER_CLASSES = [
  '[&_[data-slot=chip-media]]:border-2 [&_[data-slot=chip-media]]:border-chart-1',
  '[&_[data-slot=chip-media]]:border-2 [&_[data-slot=chip-media]]:border-chart-2',
  '[&_[data-slot=chip-media]]:border-2 [&_[data-slot=chip-media]]:border-chart-3',
  '[&_[data-slot=chip-media]]:border-2 [&_[data-slot=chip-media]]:border-chart-4',
  '[&_[data-slot=chip-media]]:border-2 [&_[data-slot=chip-media]]:border-chart-5',
  '[&_[data-slot=chip-media]]:border-2 [&_[data-slot=chip-media]]:border-chart-6',
] as const;

const BAR_CLASSES = [
  '[&_[data-slot=progress-indicator]]:bg-chart-1',
  '[&_[data-slot=progress-indicator]]:bg-chart-2',
  '[&_[data-slot=progress-indicator]]:bg-chart-3',
  '[&_[data-slot=progress-indicator]]:bg-chart-4',
  '[&_[data-slot=progress-indicator]]:bg-chart-5',
  '[&_[data-slot=progress-indicator]]:bg-chart-6',
] as const;

const DISPLAY_MODE_ITEMS: readonly SegmentItem[] = [
  { value: DISPLAY_MODE.bars, label: 'Barres', icon: 'phosphorChartBar' },
  { value: DISPLAY_MODE.radar, label: 'Radar', icon: 'phosphorPolygon' },
];

@Component({
  selector: 'app-comparator',
  imports: [
    NgIcon,
    ButtonComponent,
    CardComponent,
    ChartComponent,
    ChipComponent,
    EmptyComponent,
    ProgressComponent,
    SegmentComponent,
    SpinnerComponent,
    PokedexGridComponent,
  ],
  template: `
    <div class="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header class="flex flex-col gap-1">
        <div class="flex items-center gap-2">
          <ng-icon name="phosphorScales" class="text-primary size-7 shrink-0" />
          <h1 class="text-2xl font-semibold tracking-tight">Comparateur</h1>
        </div>
        <p class="text-muted-foreground text-sm">
          Comparez les statistiques de base de plusieurs Pokémon. Parcourez le Pokédex et
          recherchez par nom dans toutes les langues (français, anglais, allemand, japonais).
        </p>
      </header>

      @if (store.isLoading()) {
        <div class="flex flex-col items-center justify-center gap-3 py-16">
          <app-spinner class="text-primary size-8" />
          <p class="text-muted-foreground text-sm">Chargement du Pokédex…</p>
        </div>
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
        <app-card title="Choisir des Pokémon">
          <div class="flex flex-col gap-4">
            <button appButton type="button" variant="outline" full (click)="openPokedex()">
              <ng-icon name="phosphorMagnifyingGlass" class="size-4" />
              Parcourir le Pokédex
            </button>

            @if (selection().length > 0) {
              <div class="flex flex-wrap items-center gap-2">
                @for (item of selection(); track item.id) {
                  <app-chip
                    [class]="item.mediaClass"
                    [imgUrl]="item.imageUrl"
                    [alt]="item.name"
                    [hint]="item.totalLabel"
                    [removeLabel]="'Retirer ' + item.name"
                    (removed)="remove(item.id)"
                  >
                    {{ item.name }}
                  </app-chip>
                }
                <button appButton type="button" variant="ghost" size="sm" (click)="clear()">
                  <ng-icon name="phosphorTrash" class="size-4" />
                  Tout effacer
                </button>
              </div>
            }
          </div>
        </app-card>

        @if (selection().length > 0) {
          <app-card>
            <div class="flex flex-col gap-5">
              <div class="flex flex-wrap items-center justify-between gap-3">
                <h2 class="text-lg font-semibold">Statistiques de base</h2>
                <app-segment
                  variant="accent"
                  [items]="displayModeItems"
                  [value]="displayMode()"
                  (valueChange)="onDisplayModeChange($event)"
                />
              </div>

              @if (displayMode() === displayModeBars) {
                <div class="flex flex-col gap-6">
                  @for (group of statGroups(); track group.key) {
                    <section class="flex flex-col gap-2">
                      <h3 class="text-foreground text-sm font-semibold">{{ group.label }}</h3>
                      <div class="flex flex-col gap-2">
                        @for (row of group.rows; track row.id) {
                          <div class="flex items-center gap-3">
                            <span class="text-muted-foreground w-28 shrink-0 truncate text-sm">
                              {{ row.name }}
                            </span>
                            <app-progress class="h-2.5 flex-1" [class]="row.barClass" [value]="row.percent" />
                            <span class="w-10 shrink-0 text-right text-sm font-medium tabular-nums">
                              {{ row.value }}
                            </span>
                          </div>
                        }
                      </div>
                    </section>
                  }
                </div>
              } @else {
                <app-chart skeletonType="line" height="26rem" [options]="radarOptions()" />
              }
            </div>
          </app-card>
        } @else {
          <app-empty
            icon="phosphorScales"
            title="Aucun Pokémon sélectionné"
            description="Ouvrez le Pokédex pour ajouter des Pokémon à comparer."
          />
        }
      }
    </div>

    <ng-template #pokedexSheet>
      <app-pokedex-grid
        [pokemons]="store.pokemons()"
        [excludedIds]="store.selectedIdSet()"
        [disabledPicking]="store.isFull()"
        [disabledHint]="'Maximum ' + store.maxSelection + ' Pokémon — retirez-en un pour en ajouter.'"
        scrollClass="max-h-[60dvh] overflow-y-auto pb-4"
        (select)="onPick($event)"
      />
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComparatorComponent {
  protected readonly store = inject(ComparatorStore);
  readonly #palette = inject(ThemePaletteService);
  readonly #sheet = inject(SheetService);
  readonly #viewContainerRef = inject(ViewContainerRef);

  private readonly pokedexTemplate = viewChild.required<TemplateRef<unknown>>('pokedexSheet');

  protected readonly displayModeItems = DISPLAY_MODE_ITEMS;
  protected readonly displayModeBars = DISPLAY_MODE.bars;

  protected readonly displayMode = this.store.displayMode;

  protected readonly selection = computed<readonly SelectedView[]>(() =>
    this.store.selected().map((pokemon, index) => ({
      id: pokemon.id,
      name: pokemonName(pokemon, LANG.fr),
      totalLabel: `${pokemonTotal(pokemon)}`,
      imageUrl: pokemonImageUrl(pokemon.id),
      mediaClass: MEDIA_BORDER_CLASSES[index % MEDIA_BORDER_CLASSES.length],
    })),
  );

  protected readonly statGroups = computed<readonly StatGroup[]>(() => {
    const selected = this.store.selected();
    return STAT_ORDER.map(stat => ({
      key: stat,
      label: STAT_META[stat].label,
      rows: selected.map((pokemon, index) => ({
        id: pokemon.id,
        name: pokemonName(pokemon, LANG.fr),
        value: pokemon.stats[stat],
        percent: Math.round((pokemon.stats[stat] / MAX_BASE_STAT) * 100),
        barClass: BAR_CLASSES[index % BAR_CLASSES.length],
      })),
    }));
  });

  protected readonly radarOptions = computed<EChartsCoreOption>(() => {
    const palette = this.#palette.palette();
    const selected = this.store.selected();
    return {
      tooltip: { trigger: 'item' },
      legend: { bottom: 0, type: 'scroll' },
      radar: {
        radius: '65%',
        center: ['50%', '46%'],
        indicator: STAT_ORDER.map(stat => ({ name: STAT_META[stat].short, max: MAX_BASE_STAT })),
        axisName: { color: palette.mutedForeground },
        axisLine: { lineStyle: { color: palette.border } },
        splitLine: { lineStyle: { color: palette.border } },
        splitArea: { areaStyle: { color: ['transparent'] } },
      },
      series: [
        {
          type: 'radar',
          data: selected.map((pokemon, index) => {
            const color = palette.series[index % palette.series.length];
            return {
              name: pokemonName(pokemon, LANG.fr),
              value: STAT_ORDER.map(stat => pokemon.stats[stat]),
              symbolSize: 4,
              lineStyle: { color, width: 2 },
              itemStyle: { color },
              areaStyle: { color, opacity: 0.12 },
            };
          }),
        },
      ],
    };
  });

  protected openPokedex(): void {
    this.#sheet.create({
      content: this.pokedexTemplate(),
      side: 'bottom',
      title: 'Pokédex',
      hideFooter: true,
      maskClosable: true,
      viewContainerRef: this.#viewContainerRef,
      customClasses: 'p-4',
    });
  }

  protected onPick(id: number): void {
    this.store.add(id);
  }

  protected remove(id: number): void {
    this.store.remove(id);
  }

  protected clear(): void {
    this.store.clear();
  }

  protected onDisplayModeChange(value: string): void {
    this.store.setDisplayMode(value === DISPLAY_MODE.radar ? DISPLAY_MODE.radar : DISPLAY_MODE.bars);
  }

  protected reload(): void {
    this.store.reload();
  }
}
