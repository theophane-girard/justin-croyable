import { ChangeDetectionStrategy, Component, computed, inject, input, ViewEncapsulation } from '@angular/core';
import type { ClassValue } from 'clsx';
import type { EChartsCoreOption } from 'echarts/core';
import { NgxEchartsDirective } from 'ngx-echarts';

import { ThemePaletteService, type ThemePalette } from '../../core/services/theme-palette.service';
import { CHART_DEFAULTS } from '../../providers/tokens';
import { mergeClasses } from '../../utils/merge-classes';

/** Forme du skeleton affiché pendant le chargement, selon le type de graphique. */
export type ChartSkeletonType = 'bar' | 'pie' | 'gauge' | 'line' | 'curve';

@Component({
  selector: 'app-chart',
  imports: [NgxEchartsDirective],
  template: `
    <div class="relative size-full">
      <div echarts [options]="themedOptions()" [merge]="merge()" [autoResize]="true" class="size-full"></div>
      @if (loading()) {
        <div
          data-slot="chart-skeleton"
          [attr.data-skeleton-type]="skeletonType()"
          role="status"
          aria-busy="true"
          aria-label="Chargement du graphique"
          class="bg-background absolute inset-0 flex items-center justify-center overflow-hidden"
        >
          @switch (skeletonType()) {
            @case ('pie') {
              <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" class="h-4/5 max-h-full animate-pulse text-accent">
                <circle cx="50" cy="50" r="32" stroke-width="20" />
              </svg>
            }
            @case ('gauge') {
              <svg
                viewBox="0 0 100 70"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                class="h-3/5 max-h-full animate-pulse text-accent"
              >
                <path d="M8 60 A 42 42 0 0 1 92 60" stroke-width="12" />
                <path d="M50 60 L34 33" stroke-width="5" />
                <circle cx="50" cy="60" r="4" fill="currentColor" stroke="none" />
              </svg>
            }
            @case ('line') {
              <div class="size-full border-b border-l border-border pl-1 pb-px">
                <svg viewBox="0 0 100 60" preserveAspectRatio="none" fill="none" class="size-full animate-pulse text-accent">
                  <path d="M0 45 L20 30 L40 38 L60 18 L80 28 L100 12 L100 60 L0 60 Z" fill="currentColor" fill-opacity="0.15" />
                  <polyline
                    points="0,45 20,30 40,38 60,18 80,28 100,12"
                    stroke="currentColor"
                    stroke-width="3"
                    stroke-linejoin="round"
                    stroke-linecap="round"
                    vector-effect="non-scaling-stroke"
                  />
                </svg>
              </div>
            }
            @case ('curve') {
              <div class="size-full border-b border-l border-border pl-1 pb-px">
                <svg viewBox="0 0 100 60" preserveAspectRatio="none" fill="none" class="size-full animate-pulse text-accent">
                  <path
                    d="M0 42 C 12 42 18 20 30 22 C 42 24 48 40 62 34 C 76 28 82 12 100 16 L100 60 L0 60 Z"
                    fill="currentColor"
                    fill-opacity="0.15"
                  />
                  <path
                    d="M0 42 C 12 42 18 20 30 22 C 42 24 48 40 62 34 C 76 28 82 12 100 16"
                    stroke="currentColor"
                    stroke-width="3"
                    stroke-linecap="round"
                    vector-effect="non-scaling-stroke"
                  />
                </svg>
              </div>
            }
            @default {
              <div class="flex size-full items-end gap-2 border-b border-l border-border pl-2 pb-px">
                @for (bar of skeletonBars; track $index) {
                  <div class="bg-accent flex-1 animate-pulse rounded-t-md" [style.height.%]="bar"></div>
                }
              </div>
            }
          }
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'classes()',
    '[style.height]': 'height()',
  },
  exportAs: 'appChart',
})
export class ChartComponent {
  private readonly palette = inject(ThemePaletteService);
  private readonly defaults = inject(CHART_DEFAULTS);

  readonly options = input.required<EChartsCoreOption>();
  readonly merge = input<EChartsCoreOption | undefined>(undefined);
  readonly loading = input(false);
  readonly skeletonType = input<ChartSkeletonType>('bar');
  readonly height = input<string>(this.defaults.height);
  readonly class = input<ClassValue>('');

  protected readonly classes = computed(() => mergeClasses('block w-full', this.class()));

  /**
   * Hauteurs (en %) des barres du skeleton affiché pendant le chargement. Fixes
   * et non aléatoires pour rester déterministes entre les rendus et les tests.
   */
  protected readonly skeletonBars = [45, 70, 55, 85, 60, 95, 50, 75] as const;

  /**
   * ECharts rend dans un canvas : il ne résout pas `var(--primary)`. Les couleurs
   * du thème sont donc injectées en valeurs concrètes, et recalculées quand le
   * thème change puisque la palette est un signal.
   *
   * Les options de l'appelant sont fusionnées par-dessus, il garde le dernier mot.
   */
  protected readonly themedOptions = computed<EChartsCoreOption>(() => ({
    ...themeBase(this.palette.palette()),
    ...this.options(),
  }));
}

function themeBase(palette: ThemePalette): EChartsCoreOption {
  const axis = {
    axisLine: { lineStyle: { color: palette.border } },
    axisTick: { lineStyle: { color: palette.border } },
    axisLabel: { color: palette.mutedForeground },
    splitLine: { lineStyle: { color: palette.border, type: 'dashed' as const } },
  };

  return {
    color: palette.series,
    backgroundColor: 'transparent',
    textStyle: { color: palette.foreground },
    title: { textStyle: { color: palette.foreground } },
    legend: { textStyle: { color: palette.mutedForeground } },
    tooltip: {
      backgroundColor: palette.popover,
      borderColor: palette.border,
      textStyle: { color: palette.popoverForeground },
    },
    xAxis: axis,
    yAxis: axis,
  };
}
