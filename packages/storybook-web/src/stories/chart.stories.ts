import {
  ButtonComponent,
  CardComponent,
  ChartComponent,
  podiumLabel,
  ThemePaletteService,
  type ChartSkeletonType,
} from '@justin-croyable/design-system';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { map, switchMap, take, timer } from 'rxjs';
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
  series: [
    {
      name: 'Sessions',
      type: 'line',
      smooth: true,
      areaStyle: {},
      data: [220, 332, 301, 434, 390, 530],
    },
  ],
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
        {
          name: 'Sessions',
          type: 'line',
          smooth: true,
          areaStyle: {},
          data: [220, 332, 301, 434, 390, 530],
        },
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

const expectSkeleton =
  (type: ChartSkeletonType) =>
  async ({ canvasElement }: { canvasElement: HTMLElement }) => {
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
  imports: [CardComponent, ChartComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <app-card title="Couleurs choisies dans la palette">
        <app-chart [options]="teintesChoisies()" height="18rem" />
      </app-card>
      <app-card title="Couleurs sémantiques (états)">
        <app-chart [options]="etatsSemantiques()" height="18rem" />
      </app-card>
    </div>
  `,
})
class CustomColorsChartDemo {
  private readonly palette = inject(ThemePaletteService);

  protected readonly teintesChoisies = computed<EChartsCoreOption>(() => {
    const { series } = this.palette.palette();
    return {
      tooltip: { trigger: 'item' },
      legend: { bottom: 0 },
      color: [series[0], series[1], series[3]],
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

const CLASSEMENT_RACE_STEP_MS = 900;

const jardins = ['Potager de Léa', 'Jardin du Clos', 'Balcon de Sam', 'Carrés de Nour'];

const classement: EChartsCoreOption = {
  grid: { left: 8, right: 48, top: 12, bottom: 8, containLabel: true },
  tooltip: { trigger: 'axis', valueFormatter: (value: number) => `${value} kg` },
  xAxis: { type: 'value' },
  // Axe des catégories dessiné de bas en haut : la liste est inversée pour que
  // le premier du classement se retrouve en haut du graphique.
  yAxis: {
    type: 'category',
    data: [
      'Carrés de Nour',
      '\u{1F949} Balcon de Sam',
      '\u{1F948} Jardin du Clos',
      '\u{1F451} Potager de Léa',
    ],
  },
  series: [
    {
      type: 'bar',
      data: [1.2, 2.4, 3.1, 4.8],
      label: {
        show: true,
        position: 'right',
        formatter: (params: { value: number }) => `${params.value} kg`,
      },
    },
  ],
};

const course: EChartsCoreOption = {
  grid: { left: 8, right: 64, top: 12, bottom: 8, containLabel: true },
  xAxis: { type: 'value', max: 'dataMax' },
  yAxis: {
    type: 'category',
    data: jardins,
    inverse: true,
    animationDuration: 300,
    animationDurationUpdate: 300,
  },
  series: [
    {
      type: 'bar',
      realtimeSort: true,
      data: [4.8, 3.1, 2.4, 1.2],
      label: {
        show: true,
        position: 'right',
        valueAnimation: true,
        formatter: (params: { value: number }) => `${params.value} kg`,
      },
    },
  ],
  animationDuration: 0,
  animationDurationUpdate: CLASSEMENT_RACE_STEP_MS,
  animationEasing: 'linear',
  animationEasingUpdate: 'linear',
};

export const HorizontalRanking: Story = {
  args: { options: classement, height: '18rem' },
  render: args => ({
    props: args,
    moduleMetadata: { imports: [CardComponent] },
    template: `
      <app-card title="Meilleur rendement par plant">
        <app-chart [options]="options" [height]="height" />
      </app-card>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          "Barres horizontales classées, valeur posée au bout de chaque barre. Forme utilisée par la page Classement : l'axe des catégories se dessinant de bas en haut, la liste est inversée pour poser le premier en haut. Les libellés de valeur prennent la police, le corps et la couleur de texte du thème (posés hors de la barre, donc sur le fond).",
      },
    },
  },
};

const podium: EChartsCoreOption = {
  ...course,
  yAxis: {
    type: 'category',
    data: [...jardins].reverse().map((jardin, rang) => podiumLabel(jardin, rang)),
    inverse: true,
  },
  series: [
    {
      type: 'bar',
      realtimeSort: true,
      data: [4.8, 3.1, 2.4, 1.2],
      label: {
        show: true,
        position: 'right',
        formatter: (params: { value: number }) => `${params.value} kg`,
      },
    },
  ],
};

const RECOLTES: readonly (readonly number[])[] = [
  [0.4, 0.6, 0.5, 0.3],
  [1.1, 0.9, 1.4, 0.6],
  [1.9, 2.2, 2.0, 0.9],
  [3.2, 2.8, 2.6, 1.1],
  [4.8, 3.1, 2.4, 1.2],
];

const DERNIER_PAS = RECOLTES.length - 1;

@Component({
  selector: 'app-course-demo',
  imports: [ButtonComponent, CardComponent, ChartComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-card title="Course dans le temps">
      <app-chart [options]="options()" height="18rem" />
      <div card-footer class="w-full flex-row justify-start">
        <button appButton variant="outline" size="sm" (click)="rejouer()">Rejouer</button>
      </div>
    </app-card>
  `,
})
class CourseDemo {
  protected readonly lecture = signal(0);

  private readonly pas = toSignal(
    toObservable(this.lecture).pipe(
      switchMap(() => timer(0, CLASSEMENT_RACE_STEP_MS).pipe(take(RECOLTES.length))),
      map(index => Math.min(index, DERNIER_PAS)),
    ),
    { initialValue: 0 },
  );

  protected readonly options = computed<EChartsCoreOption>(() => {
    const pas = this.pas();
    const valeurs = RECOLTES[pas];
    const termine = pas === DERNIER_PAS;
    const classement = [...valeurs]
      .map((valeur, index) => ({ valeur, index }))
      .sort((gauche, droite) => droite.valeur - gauche.valeur)
      .map(entree => entree.index);
    return {
      ...course,
      yAxis: {
        type: 'category',
        data: jardins.map((jardin, index) =>
          termine ? podiumLabel(jardin, classement.indexOf(index)) : jardin,
        ),
        inverse: true,
        animationDuration: 300,
        animationDurationUpdate: 300,
      },
      series: [
        {
          type: 'bar',
          realtimeSort: true,
          data: [...valeurs],
          label: {
            show: true,
            position: 'right',
            valueAnimation: true,
            formatter: (params: { value: number }) => `${params.value} kg`,
          },
        },
      ],
    };
  });

  protected rejouer(): void {
    this.lecture.update(lecture => lecture + 1);
  }
}

export const BarRace: Story = {
  render: () => ({
    moduleMetadata: { imports: [CourseDemo] },
    template: '<app-course-demo />',
  }),
  play: async ({ canvasElement }) => {
    const attendreLeGraphique = () =>
      waitFor(
        () => {
          const trouve = canvasElement.querySelector('canvas');
          expect(trouve).toBeTruthy();
          return trouve as HTMLCanvasElement;
        },
        { timeout: 15_000 },
      );

    await attendreLeGraphique();
    const rejouer = canvasElement.querySelector('button');
    expect(rejouer?.textContent?.trim()).toBe('Rejouer');
    rejouer?.click();
    const graphique = await attendreLeGraphique();
    expect(graphique.width).toBeGreaterThan(0);
  },
  parameters: {
    docs: {
      description: {
        story:
          "Barres classées en continu (`realtimeSort`) : la même forme animée, où les barres se réordonnent à chaque nouvelle valeur. L'appelant pilote les étapes en repassant des options, la durée d'animation étant calée sur son pas de temps — ici un minuteur que le bouton « Rejouer » relance. À la dernière étape, `podiumLabel` marque les trois premiers.",
      },
    },
  },
};

export const BarRaceTerminee: Story = {
  args: { options: podium, height: '18rem' },
  render: args => ({
    props: args,
    moduleMetadata: { imports: [CardComponent] },
    template: `
      <app-card title="Course terminée">
        <app-chart [options]="options" [height]="height" />
      </app-card>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story:
          "Fin de course : `podiumLabel` préfixe les trois premiers libellés d'une couronne puis des médailles d'argent et de bronze. Des emoji, car un graphique se dessine sur un canevas où le libellé d'axe n'accepte que du texte.",
      },
    },
  },
};

export const Dashboard: Story = {
  argTypes: seriesCountControl,
  args: { seriesCount: 1 },
  render: args => ({
    props: { barresEmpilees, jauge, courbe: withSeriesCount(courbe, args.seriesCount), camembert },
    moduleMetadata: { imports: [CardComponent] },
    template: `
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <app-card title="Inscriptions & désabonnements (empilé)">
          <app-chart [options]="barresEmpilees" height="15rem" />
        </app-card>
        <app-card title="Taux de satisfaction">
          <app-chart [options]="jauge" height="15rem" />
        </app-card>
        <app-card title="Sessions (tendance)">
          <app-chart [options]="courbe" height="15rem" />
        </app-card>
        <app-card title="Répartition par framework">
          <app-chart [options]="camembert" height="15rem" />
        </app-card>
      </div>
    `,
  }),
};
