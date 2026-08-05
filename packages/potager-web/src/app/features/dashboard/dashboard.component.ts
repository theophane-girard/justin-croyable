import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  ButtonComponent,
  CardComponent,
  ChartComponent,
  CountUpDirective,
  EmptyComponent,
  SegmentComponent,
  type SegmentItem,
} from '@justin-croyable/design-system';
import { NgIcon } from '@ng-icons/core';
import type { EChartsCoreOption } from 'echarts/core';

import { HarvestStore, MONTHS_FR } from '../../core/harvest-store';
import { ExpenseStore } from '../../core/expense-store';
import { PRICE_MODE, type PriceMode } from '../../core/potager.model';
import { APP_PATHS } from '../../app.routes';

const TOP_CROPS_COUNT = 8;

const PRICE_MODE_ITEMS: SegmentItem[] = [
  { value: PRICE_MODE.conventional, label: 'Conventionnel', icon: 'phosphorBasket' },
  { value: PRICE_MODE.bio, label: 'Bio', icon: 'phosphorLeaf' },
];

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
    SegmentComponent,
  ],
  template: `
    <div class="flex flex-col gap-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-col">
          <h2 class="text-foreground text-lg font-semibold">Tableau de bord</h2>
          <p class="text-muted-foreground text-sm">
            Économies nettes : valeur récoltée aux prix moyens français, dépenses déduites.
          </p>
        </div>
        <app-segment
          variant="accent"
          class="ml-auto"
          [items]="priceModeItems"
          [value]="store.priceMode()"
          (valueChange)="onPriceModeChange($event)"
        />
      </div>

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
                <span class="text-muted-foreground text-sm">Économies nettes</span>
                <span class="text-primary text-3xl font-bold tabular-nums">
                  <span appCountUp>{{ netSavingsEur() }}</span> €
                </span>
              </div>
              <div class="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
                <ng-icon name="phosphorPiggyBank" class="size-5" />
              </div>
            </div>
          </app-card>

          <app-card>
            <div class="flex items-center justify-between">
              <div class="flex flex-col gap-1">
                <span class="text-muted-foreground text-sm">Valeur récoltée</span>
                <span class="text-foreground text-3xl font-bold tabular-nums">
                  <span appCountUp>{{ store.totalSavingsEur() }}</span> €
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
                <span class="text-muted-foreground text-sm">Dépenses</span>
                <span class="text-foreground text-3xl font-bold tabular-nums">
                  <span appCountUp>{{ expenses.totalExpensesEur() }}</span> €
                </span>
              </div>
              <div class="bg-secondary text-secondary-foreground flex size-10 items-center justify-center rounded-lg">
                <ng-icon name="phosphorReceipt" class="size-5" />
              </div>
            </div>
          </app-card>

          <app-card>
            <div class="flex items-center justify-between">
              <div class="flex flex-col gap-1">
                <span class="text-muted-foreground text-sm">Total récolté</span>
                <span class="text-foreground text-3xl font-bold tabular-nums">
                  <span appCountUp>{{ store.totalWeightKg() }}</span> kg
                </span>
              </div>
              <div class="bg-secondary text-secondary-foreground flex size-10 items-center justify-center rounded-lg">
                <ng-icon name="phosphorScales" class="size-5" />
              </div>
            </div>
          </app-card>
        </div>

        <app-card
          title="Valeur récoltée et dépenses par mois"
          description="Valeur estimée des récoltes (€) et dépenses (€) sur l'année."
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
            title="Répartition des dépenses"
            description="Montant dépensé par catégorie d'achat."
          >
            <app-chart [options]="expensesByCategoryOptions()" height="18rem" />
          </app-card>
        </div>
      </div>
    }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  protected readonly store = inject(HarvestStore);
  protected readonly expenses = inject(ExpenseStore);

  protected readonly harvestsLink = `/${APP_PATHS.harvests}`;
  protected readonly priceModeItems = PRICE_MODE_ITEMS;

  protected readonly netSavingsEur = computed(
    () => Math.round((this.store.totalSavingsEur() - this.expenses.totalExpensesEur()) * 100) / 100,
  );

  protected onPriceModeChange(value: string): void {
    const mode: PriceMode = value === PRICE_MODE.bio ? PRICE_MODE.bio : PRICE_MODE.conventional;
    this.store.setPriceMode(mode);
  }

  protected readonly monthlyOptions = computed<EChartsCoreOption>(() => ({
    tooltip: { trigger: 'axis' },
    legend: { data: ['Valeur récoltée (€)', 'Dépenses (€)'] },
    grid: { left: 12, right: 12, top: 48, bottom: 8, containLabel: true },
    xAxis: { type: 'category', data: [...MONTHS_FR] },
    yAxis: { type: 'value', name: '€' },
    series: [
      { name: 'Valeur récoltée (€)', type: 'bar', data: this.store.monthlySavings() },
      {
        name: 'Dépenses (€)',
        type: 'line',
        smooth: true,
        areaStyle: {},
        data: this.expenses.monthlyExpenses(),
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

  protected readonly expensesByCategoryOptions = computed<EChartsCoreOption>(() => ({
    tooltip: { trigger: 'item', formatter: '{b} : {c} € ({d} %)' },
    legend: { bottom: 0 },
    series: [
      {
        type: 'pie',
        radius: ['45%', '70%'],
        data: this.expenses
          .expensesByCategory()
          .map(item => ({ name: item.label, value: item.value })),
      },
    ],
  }));
}
