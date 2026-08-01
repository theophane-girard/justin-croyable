import { ChartComponent } from '@justin-croyable/design-system';
import type { EChartsCoreOption } from 'echarts/core';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { expect, waitFor } from 'storybook/test';

type ChartArgs = {
  options: EChartsCoreOption;
  height: string;
  loading: boolean;
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
  },
  args: { options: barres, height: '20rem', loading: false },
  render: args => ({
    props: args,
    template: `<app-chart [options]="options" [height]="height" [loading]="loading" />`,
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

export const Loading: Story = {
  args: { loading: true },
  /**
   * En chargement, le composant remplace le canvas ECharts par un skeleton en
   * forme d'histogramme plutôt que par le spinner par défaut d'ECharts.
   */
  play: async ({ canvasElement }) => {
    const skeleton = await waitFor(() => {
      const found = canvasElement.querySelector('[data-slot="chart-skeleton"]');
      expect(found).toBeTruthy();
      return found as HTMLElement;
    });

    // Le skeleton s'affiche à la place du graphique, sans canvas monté.
    expect(canvasElement.querySelector('canvas')).toBeNull();
    expect(skeleton.getAttribute('aria-busy')).toBe('true');
  },
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
