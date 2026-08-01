import { ChartComponent, type ChartSkeletonType } from '@justin-croyable/design-system';
import type { EChartsCoreOption } from 'echarts/core';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { expect, waitFor } from 'storybook/test';

type ChartArgs = {
  options: EChartsCoreOption;
  height: string;
  loading: boolean;
  skeletonType: ChartSkeletonType;
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
    skeletonType: { control: 'select', options: ['bar', 'pie', 'gauge', 'line'] },
  },
  args: { options: barres, height: '20rem', loading: false, skeletonType: 'bar' },
  render: args => ({
    props: args,
    template: `<app-chart [options]="options" [height]="height" [loading]="loading" [skeletonType]="skeletonType" />`,
  }),
};

export default meta;
type Story = StoryObj<ChartArgs>;

export const Bars: Story = {
  /**
   * ECharts est chargé à la demande par `withCharts()`, d'où l'attente : le
   * canvas n'existe qu'une fois le bundle résolu. Le délai par défaut d'une
   * seconde n'y suffit pas au premier chargement, quand le module n'est encore
   * ni bundlé ni en cache.
   */
  play: async ({ canvasElement }) => {
    const canvas = await waitFor(
      () => {
        const found = canvasElement.querySelector('canvas');
        expect(found).toBeTruthy();
        return found as HTMLCanvasElement;
      },
      { timeout: 15_000 },
    );

    // Un canvas de largeur nulle signifie un graphique monté mais jamais peint.
    expect(canvas.width).toBeGreaterThan(0);
    expect(canvas.height).toBeGreaterThan(0);
  },
};

export const Line: Story = {
  args: {
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
  args: {
    height: '22rem',
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

/**
 * Vérifie qu'en chargement le composant affiche le skeleton attendu (à la place
 * du canvas ECharts et de son spinner par défaut), pour le type demandé.
 */
const expectSkeleton = (type: ChartSkeletonType) => async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  const skeleton = await waitFor(() => {
    const found = canvasElement.querySelector('[data-slot="chart-skeleton"]');
    expect(found).toBeTruthy();
    return found as HTMLElement;
  });

  expect(canvasElement.querySelector('canvas')).toBeNull();
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

export const LoadingPie: Story = {
  args: { loading: true, skeletonType: 'pie', height: '22rem' },
  play: expectSkeleton('pie'),
};

export const LoadingGauge: Story = {
  args: { loading: true, skeletonType: 'gauge', height: '22rem' },
  play: expectSkeleton('gauge'),
};

export const MultipleSeries: Story = {
  args: {
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
