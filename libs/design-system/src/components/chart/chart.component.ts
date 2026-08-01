import { ChangeDetectionStrategy, Component, computed, inject, input, ViewEncapsulation } from '@angular/core';
import type { ClassValue } from 'clsx';
import type { EChartsCoreOption } from 'echarts/core';
import { NgxEchartsDirective } from 'ngx-echarts';

import { ThemePaletteService, type ThemePalette } from '../../core/services/theme-palette.service';
import { CHART_DEFAULTS } from '../../providers/tokens';
import { mergeClasses } from '../../utils/merge-classes';

@Component({
  selector: 'app-chart',
  imports: [NgxEchartsDirective],
  template: `
    <div
      echarts
      [options]="themedOptions()"
      [merge]="merge()"
      [loading]="loading()"
      [autoResize]="true"
      class="size-full"
    ></div>
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
  readonly height = input<string>(this.defaults.height);
  readonly class = input<ClassValue>('');

  protected readonly classes = computed(() => mergeClasses('block w-full', this.class()));

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
