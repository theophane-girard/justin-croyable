import { ChartComponent, ThemePaletteService, type ChartSkeletonType } from '@justin-croyable/design-system';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import type { EChartsCoreOption } from 'echarts/core';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { expect, waitFor } from 'storybook/test';

type ChartArgs = {
  options: EChartsCoreOption;
  height: string;
  loading: boolean;
  skeletonType: ChartSkeletonType;
  seriesCount?: number;
};

const mois = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'];

const barres: EChartsCoreOption = {
  tooltip: { trigger: 'axis' },
  legend: { data: ['Inscriptions', 'Désabonnements'] },
  xAxis: { type: 'category', data: mois },
  yAxis: { type: 'value' },
  series: [
    { name: 'Inscriptions', type: 'bar', data: [820, 932, 901, 1290, 1330, 1520] },
    { name: 'Désabonnements', type: 'bar', data: [120, 132, 101, 134, 90, 230] },
  ],
};

const barresEmpilees: EChartsCoreOption = {
  tooltip: { trigger: 'axis' },
  legend: { data: ['Inscriptions', 'Désabonnements'] },
  xAxis: { type: 'category', data: mois },
  yAxis: { type: 'value' },
  series: [
    { name: 'Inscriptions', type: 'bar', stack: 'total', data: [820, 932, 901, 1290, 1330, 1520] },
    { name: 'Désabonnements', type: 'bar', stack: 'total', data: [120, 210, 190, 134, 200, 230] },
  ],
};

const jauge: EChartsCoreOption = {
  series: [
    {
      type: 'gauge',
      progress: { show: true, width: 10 },
      axisLine: { lineStyle: { width: 10 } },
      detail: { valueAnimation: true, formatter: '{value}%', fontSize: 20 },
      data: [{ value: 72, name: 'Satisfaction' }],
    },
  ],
};

const courbe: EChartsCoreOption = {
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', boundaryGap: false, data: mois },
  yAxis: { type: 'value' },
  series: [{ name: 'Sessions', type: 'line', smooth: true, areaStyle: {}, data: [220, 332, 301, 434, 390, 530] }],
};

const camembert: EChartsCoreOption = {
  tooltip: { trigger: 'item' },
  legend: { bottom: 0 },
  series: [
    {
      type: 'pie',
      radius: ['45%', '70%'],
      data: [
        { value: 1048, name: 'Angular' },
        { value: 735, name: 'React' },
        { value: 580, name: 'Vue' },
        { value: 300, name: 'Svelte' },
      ],
    },
  ],
};

type ChartSeriesItem = { type?: string; name?: string; data?: unknown[]; [key: string]: unknown };

function withSeriesCount(options: EChartsCoreOption, count: number | undefined): EChartsCoreOption {
  const series = (options as EChartsCoreOption & { series?: ChartSeriesItem[] }).series;
  if (!count || count < 1 || !series || series.length === 0) {
    return options;
  }
  const [template] = series;

  if (template.type === 'pie') {
    if (count === (template.data?.length ?? 0)) {
      return options;
    }
    const data = Array.from({ length: count }, (_, index) => ({
      value: 300 + ((index * 137) % 900),
      name: `Série ${index + 1}`,
    }));
    return { ...options, series: [{ ...template, data }] } as EChartsCoreOption;
  }

  if (count === series.length) {
    return options;
  }
  const generated = Array.from({ length: count }, (_, index) => ({
    ...template,
    name: `Série ${index + 1}`,
    data: mois.map((_, position) => 200 + index * 120 + position * 30),
  }));
  return { ...options, series: generated } as EChartsCoreOption;
}

const seriesCountControl: Meta<ChartArgs>['argTypes'] = {
  seriesCount: {
    control: { type: 'number', min: 1, max: 12 },
    description: 'Nombre de séries (courbes) affichées',
  },
};

const meta: Meta<ChartArgs> = {
  title: 'Composants/Chart',
  component: ChartComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          "Enveloppe `ngx-echarts`. Les couleurs viennent du thème du DS : ECharts dessinant dans un canvas, elles sont résolues en valeurs concrètes par `ThemePaletteService` et recalculées à chaque bascule de thème. Les options passées par l'appelant sont fusionnées par-dessus ce socle, il garde donc le dernier mot. Nécessite `withCharts()` dans les providers de l'application.",
      },
    },
  },
  argTypes: {
    options: { control: 'object' },
    height: { control: 'text' },
    loading: { control: 'boolean' },
    skeletonType: { control: 'select', options: ['bar', 'pie', 'gauge', 'line', 'curve'] },
  },
  args: { options: barres, height: '20rem', loading: false, skeletonType: 'bar' },
  render: args => ({
    props: { ...args, options: withSeriesCount(args.options, args.seriesCount) },
    template: `<app-chart [options]="options" [height]="height" [loading]="loading" [skeletonType]="skeletonType" />`,
  }),
};

export default meta;
type Story = StoryObj<ChartArgs>;

export const Bars: Story = {
  argTypes: seriesCountControl,
  args: { seriesCount: 2 },
  play: async ({ canvasElement }) => {
    const canvas = await waitFor(
      () => {
        const found = canvasElement.querySelector('canvas');
        expect(found).toBeTruthy();
        return found as HTMLCanvasElement;
      },
      { timeout: 15_000 },
    );

    expect(canvas.width).toBeGreaterThan(0);
    expect(canvas.height).toBeGreaterThan(0);
  },
};

export const Line: Story = {
  argTypes: seriesCountControl,
  args: {
    seriesCount: 1,
    options: {
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', boundaryGap: false, data: mois },
      yAxis: { type: 'value' },
      series: [
        { name: 'Sessions', type: 'line', smooth: true, areaStyle: {}, data: [220, 332, 301, 434, 390, 530] },
      ],
    },
  },
};

export const Pie: Story = {
  argTypes: seriesCountControl,
  args: {
    height: '22rem',
    seriesCount: 4,
    options: {
      tooltip: { trigger: 'item' },
      legend: { bottom: 0 },
      series: [
        {
          type: 'pie',
          radius: ['45%', '70%'],
          data: [
            { value: 1048, name: 'Angular' },
            { value: 735, name: 'React' },
            { value: 580, name: 'Vue' },
            { value: 300, name: 'Svelte' },
          ],
        },
      ],
    },
  },
};

const expectSkeleton = (type: ChartSkeletonType) => async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const skeleton = await waitFor(() => {
    const found = canvasElement.querySelector('[data-slot="chart-skeleton"]');
    expect(found).toBeTruthy();
    return found as HTMLElement;
  });

  expect(skeleton.getAttribute('aria-busy')).toBe('true');
  expect(skeleton.getAttribute('data-skeleton-type')).toBe(type);
};

export const LoadingBar: Story = {
  args: { loading: true, skeletonType: 'bar' },
  play: expectSkeleton('bar'),
};

export const LoadingLine: Story = {
  args: { loading: true, skeletonType: 'line' },
  play: expectSkeleton('line'),
};

export const LoadingCurve: Story = {
  args: { loading: true, skeletonType: 'curve' },
  play: expectSkeleton('curve'),
};

export const LoadingPie: Story = {
  args: { loading: true, skeletonType: 'pie', height: '22rem' },
  play: expectSkeleton('pie'),
};

export const LoadingGauge: Story = {
  args: { loading: true, skeletonType: 'gauge', height: '22rem' },
  play: expectSkeleton('gauge'),
};

export const Reloading: Story = {
  args: { loading: true, skeletonType: 'bar' },
  play: async ({ canvasElement }) => {
    const canvas = await waitFor(
      () => {
        const found = canvasElement.querySelector('canvas');
        expect(found).toBeTruthy();
        return found as HTMLCanvasElement;
      },
      { timeout: 15_000 },
    );

    expect(canvas.width).toBeGreaterThan(0);

    const skeleton = canvasElement.querySelector('[data-slot="chart-skeleton"]');
    expect(skeleton).toBeTruthy();
    expect(skeleton?.getAttribute('aria-busy')).toBe('true');
  },
};

export const MultipleSeries: Story = {
  argTypes: seriesCountControl,
  args: {
    seriesCount: 5,
    options: {
      tooltip: { trigger: 'axis' },
      legend: {},
      xAxis: { type: 'category', data: mois },
      yAxis: { type: 'value' },
      series: [1, 2, 3, 4, 5].map(index => ({
        name: `Série ${index}`,
        type: 'line' as const,
        data: mois.map((_, position) => 200 * index + position * 40),
      })),
    },
  },
};

@Component({
  selector: 'app-custom-colors-chart-demo',
  imports: [ChartComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div class="border-border rounded-lg border p-4">
        <h3 class="text-foreground mb-3 text-sm font-medium">Couleurs choisies par teinte</h3>
        <app-chart [options]="teintesChoisies()" height="18rem" />
      </div>
      <div class="border-border rounded-lg border p-4">
        <h3 class="text-foreground mb-3 text-sm font-medium">Couleurs sémantiques (états)</h3>
        <app-chart [options]="etatsSemantiques()" height="18rem" />
      </div>
    </div>
  `,
})
class CustomColorsChartDemo {
  private readonly palette = inject(ThemePaletteService);

  protected readonly teintesChoisies = computed<EChartsCoreOption>(() => {
    const { chart } = this.palette.palette();
    return {
      tooltip: { trigger: 'item' },
      legend: { bottom: 0 },
      color: [chart.orange, chart.violet, chart.cyan],
      series: [
        {
          type: 'pie',
          radius: ['45%', '70%'],
          data: [
            { value: 1048, name: 'Mobile' },
            { value: 735, name: 'Desktop' },
            { value: 580, name: 'Tablette' },
          ],
        },
      ],
    };
  });

  protected readonly etatsSemantiques = computed<EChartsCoreOption>(() => {
    const { semantic } = this.palette.palette();
    return {
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: ['Réussis', 'En attente', 'Échecs'] },
      yAxis: { type: 'value' },
      series: [
        {
          type: 'bar',
          data: [
            { value: 420, itemStyle: { color: semantic.success } },
            { value: 120, itemStyle: { color: semantic.warning } },
            { value: 60, itemStyle: { color: semantic.error } },
          ],
        },
      ],
    };
  });
}

export const WithCustomColor: Story = {
  render: () => ({
    template: `<app-custom-colors-chart-demo />`,
    moduleMetadata: { imports: [CustomColorsChartDemo] },
  }),
};

export const Dashboard: Story = {
  argTypes: seriesCountControl,
  args: { seriesCount: 1 },
  render: args => ({
    props: { barresEmpilees, jauge, courbe: withSeriesCount(courbe, args.seriesCount), camembert },
    template: `
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div class="border-border rounded-lg border p-4">
          <h3 class="text-foreground mb-3 text-sm font-medium">Inscriptions & désabonnements (empilé)</h3>
          <app-chart [options]="barresEmpilees" height="15rem" />
        </div>
        <div class="border-border rounded-lg border p-4">
          <h3 class="text-foreground mb-3 text-sm font-medium">Taux de satisfaction</h3>
          <app-chart [options]="jauge" height="15rem" />
        </div>
        <div class="border-border rounded-lg border p-4">
          <h3 class="text-foreground mb-3 text-sm font-medium">Sessions (tendance)</h3>
          <app-chart [options]="courbe" height="15rem" />
        </div>
        <div class="border-border rounded-lg border p-4">
          <h3 class="text-foreground mb-3 text-sm font-medium">Répartition par framework</h3>
          <app-chart [options]="camembert" height="15rem" />
        </div>
      </div>
    `,
  }),
};
