import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  ButtonComponent,
  CardComponent,
  ChartComponent,
  CountUpDirective,
  EmptyComponent,
} from '@justin-croyable/design-system';
import { NgIcon } from '@ng-icons/core';
import type { EChartsCoreOption } from 'echarts/core';

import { HarvestStore, MONTHS_FR } from '../../core/harvest-store';
import { APP_PATHS } from '../../app.routes';

const TOP_CROPS_COUNT = 8;

@Component({
  selector: 'app-dashboard',
  imports: [
    RouterLink,
    NgIcon,
    CardComponent,
    ChartComponent,
    CountUpDirective,
    ButtonComponent,
    EmptyComponent,
  ],
  template: `
    @if (store.entryCount() === 0) {
      <app-empty
        icon="phosphorPlant"
        title="Aucune récolte enregistrée"
        description="Ajoutez votre première récolte pour visualiser vos économies."
      >
        <a appButton [routerLink]="harvestsLink">
          <ng-icon name="phosphorPlus" class="size-4" />
          Ajouter une récolte
        </a>
      </app-empty>
    } @else {
      <div class="flex flex-col gap-4">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <app-card>
            <div class="flex items-center justify-between">
              <div class="flex flex-col gap-1">
                <span class="text-muted-foreground text-sm">Total récolté</span>
                <span class="text-foreground text-3xl font-bold tabular-nums">
                  <span appCountUp>{{ store.totalWeightKg() }}</span> kg
                </span>
              </div>
              <div class="bg-secondary text-secondary-foreground flex size-10 items-center justify-center rounded-lg">
                <ng-icon name="phosphorBasket" class="size-5" />
              </div>
            </div>
          </app-card>

          <app-card>
            <div class="flex items-center justify-between">
              <div class="flex flex-col gap-1">
                <span class="text-muted-foreground text-sm">Économies estimées</span>
                <span class="text-primary text-3xl font-bold tabular-nums">
                  <span appCountUp>{{ store.totalSavingsEur() }}</span> €
                </span>
              </div>
              <div class="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
                <ng-icon name="phosphorCoins" class="size-5" />
              </div>
            </div>
          </app-card>

          <app-card>
            <div class="flex items-center justify-between">
              <div class="flex flex-col gap-1">
                <span class="text-muted-foreground text-sm">Cultures différentes</span>
                <span class="text-foreground text-3xl font-bold tabular-nums">
                  <span appCountUp>{{ store.cropCount() }}</span>
                </span>
              </div>
              <div class="bg-secondary text-secondary-foreground flex size-10 items-center justify-center rounded-lg">
                <ng-icon name="phosphorLeaf" class="size-5" />
              </div>
            </div>
          </app-card>

          <app-card>
            <div class="flex items-center justify-between">
              <div class="flex flex-col gap-1">
                <span class="text-muted-foreground text-sm">Récoltes enregistrées</span>
                <span class="text-foreground text-3xl font-bold tabular-nums">
                  <span appCountUp>{{ store.entryCount() }}</span>
                </span>
              </div>
              <div class="bg-secondary text-secondary-foreground flex size-10 items-center justify-center rounded-lg">
                <ng-icon name="phosphorScales" class="size-5" />
              </div>
            </div>
          </app-card>
        </div>

        <app-card
          title="Récoltes et économies par mois"
          description="Poids récolté (kg) et économies estimées (€) sur l'année."
        >
          <app-chart [options]="monthlyOptions()" height="18rem" />
        </app-card>

        <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <app-card
            title="Économies par culture"
            description="Valeur estimée de chaque culture au prix moyen français."
          >
            <app-chart [options]="savingsByCropOptions()" height="18rem" />
          </app-card>

          <app-card
            title="Répartition des récoltes"
            description="Poids récolté par catégorie."
          >
            <app-chart [options]="categoryOptions()" height="18rem" />
          </app-card>
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  protected readonly store = inject(HarvestStore);

  protected readonly harvestsLink = `/${APP_PATHS.harvests}`;

  protected readonly monthlyOptions = computed<EChartsCoreOption>(() => ({
    tooltip: { trigger: 'axis' },
    legend: { data: ['Récolte (kg)', 'Économies (€)'] },
    grid: { left: 12, right: 12, top: 48, bottom: 8, containLabel: true },
    xAxis: { type: 'category', data: [...MONTHS_FR] },
    yAxis: [
      { type: 'value', name: 'kg' },
      { type: 'value', name: '€' },
    ],
    series: [
      { name: 'Récolte (kg)', type: 'bar', data: this.store.monthlyWeights() },
      {
        name: 'Économies (€)',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        areaStyle: {},
        data: this.store.monthlySavings(),
      },
    ],
  }));

  protected readonly savingsByCropOptions = computed<EChartsCoreOption>(() => {
    const top = this.store.savingsByCrop().slice(0, TOP_CROPS_COUNT);
    return {
      tooltip: { trigger: 'axis' },
      grid: { left: 12, right: 24, top: 12, bottom: 8, containLabel: true },
      xAxis: { type: 'value' },
      yAxis: { type: 'category', data: top.map(item => item.label).reverse() },
      series: [{ type: 'bar', data: top.map(item => item.value).reverse() }],
    };
  });

  protected readonly categoryOptions = computed<EChartsCoreOption>(() => ({
    tooltip: { trigger: 'item', formatter: '{b} : {c} kg ({d} %)' },
    legend: { bottom: 0 },
    series: [
      {
        type: 'pie',
        radius: ['45%', '70%'],
        data: this.store.weightByCategory().map(item => ({ name: item.label, value: item.value })),
      },
    ],
  }));
}
