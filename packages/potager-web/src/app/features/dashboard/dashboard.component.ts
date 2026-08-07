import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  ButtonComponent,
  CardComponent,
  ChartComponent,
  CountUpDirective,
  EmptyComponent,
  FabButtonComponent,
  SegmentComponent,
  type SegmentItem,
  SelectImports,
  SheetService,
} from '@justin-croyable/design-system';
import { NgIcon } from '@ng-icons/core';
import type { EChartsCoreOption } from 'echarts/core';

import { HarvestStore, MONTHS_FR } from '../../core/harvest-store';
import { ExpenseStore } from '../../core/expense-store';
import { SeasonStore } from '../../core/season-store';
import {
  isSeasonFilter,
  PRICE_MODE,
  type PriceMode,
  SEASON,
  SEASON_FILTER_ALL,
  SEASON_META,
} from '../../core/potager.model';
import { buildYearOptions, parseYearValue, yearFilterToValue } from '../../core/period-selector';
import { APP_PATHS } from '../../app.routes';

const TOP_CROPS_COUNT = 8;

const PRICE_MODE_ITEMS: SegmentItem[] = [
  { value: PRICE_MODE.conventional, label: 'Conventionnel', icon: 'phosphorBasket' },
  { value: PRICE_MODE.bio, label: 'Bio', icon: 'phosphorLeaf' },
];

const SEASON_FILTER_ITEMS: SegmentItem[] = [
  { value: SEASON_FILTER_ALL, label: 'Année entière' },
  { value: SEASON.summer, label: SEASON_META.summer.label, icon: SEASON_META.summer.icon },
  { value: SEASON.winter, label: SEASON_META.winter.label, icon: SEASON_META.winter.icon },
];

const SAVINGS_GROUP = { crop: 'crop', variety: 'variety' } as const;
type SavingsGroup = (typeof SAVINGS_GROUP)[keyof typeof SAVINGS_GROUP];

const SAVINGS_GROUP_ITEMS: SegmentItem[] = [
  { value: SAVINGS_GROUP.crop, label: 'Culture' },
  { value: SAVINGS_GROUP.variety, label: 'Variété' },
];

const SAVINGS_GROUP_TITLE: Readonly<Record<SavingsGroup, string>> = {
  [SAVINGS_GROUP.crop]: 'Économies par culture',
  [SAVINGS_GROUP.variety]: 'Économies par variété',
};

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
    FabButtonComponent,
    SegmentComponent,
    ...SelectImports,
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
        <div class="hidden items-center gap-2 sm:ml-auto sm:flex sm:w-auto sm:flex-nowrap">
          @if (showYearSelector()) {
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
          }
          <app-segment
            class="order-last w-full sm:order-none sm:w-auto"
            variant="default"
            [items]="seasonItems"
            [value]="season.season()"
            (valueChange)="onSeasonChange($event)"
          />
          <app-segment
            class="ml-auto sm:ml-0"
            variant="default"
            [items]="priceModeItems"
            [value]="store.priceMode()"
            (valueChange)="onPriceModeChange($event)"
          />
        </div>
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
                <span class="text-foreground text-3xl font-bold tabular-nums">
                  <span appCountUp>{{ netSavingsEur() }}</span> €
                </span>
              </div>
              @if (netSavingsPositive()) {
                <div class="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
                  <ng-icon name="phosphorTrendUp" class="size-5" />
                </div>
              } @else {
                <div class="bg-destructive/10 text-destructive flex size-10 items-center justify-center rounded-lg">
                  <ng-icon name="phosphorTrendDown" class="size-5" />
                </div>
              }
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
            [title]="savingsCardTitle()"
            description="Valeur estimée au prix moyen français."
          >
            <div class="mb-3 flex justify-end">
              <app-segment
                variant="default"
                size="sm"
                [items]="savingsGroupItems"
                [value]="savingsGroup()"
                (valueChange)="onSavingsGroupChange($event)"
              />
            </div>
            <app-chart [options]="savingsChartOptions()" height="18rem" />
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

    @if (store.entryCount() > 0) {
      <button
        appFabButton
        variant="secondary"
        position="bottom-right"
        class="sm:hidden"
        aria-label="Filtrer le tableau de bord"
        (click)="openFilter()"
      >
        <ng-icon name="phosphorFunnel" />
      </button>
    }

    <ng-template #filterSheet>
      <div class="flex flex-col gap-4 p-4">
        @if (showYearSelector()) {
          <app-select
            label="Année"
            prefixIcon="phosphorCalendarBlank"
            [value]="yearValue()"
            (valueChange)="onYearChange($event)"
          >
            @for (option of yearOptions(); track option.value) {
              <app-select-item [value]="option.value">{{ option.label }}</app-select-item>
            }
          </app-select>
        }
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium">Saison</label>
          <app-segment
            variant="accent"
            [items]="seasonItems"
            [value]="season.season()"
            (valueChange)="onSeasonChange($event)"
          />
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium">Prix</label>
          <app-segment
            variant="accent"
            [items]="priceModeItems"
            [value]="store.priceMode()"
            (valueChange)="onPriceModeChange($event)"
          />
        </div>
      </div>
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  protected readonly store = inject(HarvestStore);
  protected readonly expenses = inject(ExpenseStore);
  protected readonly season = inject(SeasonStore);
  readonly #sheet = inject(SheetService);

  private readonly filterSheetTemplate = viewChild.required<TemplateRef<unknown>>('filterSheet');

  protected readonly harvestsLink = `/${APP_PATHS.harvests}`;
  protected readonly priceModeItems = PRICE_MODE_ITEMS;
  protected readonly seasonItems = SEASON_FILTER_ITEMS;
  protected readonly savingsGroupItems = SAVINGS_GROUP_ITEMS;

  protected readonly savingsGroup = signal<SavingsGroup>(SAVINGS_GROUP.crop);

  protected readonly savingsCardTitle = computed(() => SAVINGS_GROUP_TITLE[this.savingsGroup()]);

  protected readonly showYearSelector = computed(() => this.store.availableYears().length >= 2);
  protected readonly yearOptions = computed(() => buildYearOptions(this.store.availableYears()));
  protected readonly yearValue = computed(() => yearFilterToValue(this.store.effectiveYear()));

  protected readonly netSavingsEur = computed(
    () => Math.round((this.store.totalSavingsEur() - this.expenses.totalExpensesEur()) * 100) / 100,
  );

  protected readonly netSavingsPositive = computed(() => this.netSavingsEur() >= 0);

  protected openFilter(): void {
    this.#sheet.create({
      title: 'Filtrer',
      side: 'bottom',
      okText: 'Fermer',
      cancelText: null,
      content: this.filterSheetTemplate(),
    });
  }

  protected onPriceModeChange(value: string): void {
    const mode: PriceMode = value === PRICE_MODE.bio ? PRICE_MODE.bio : PRICE_MODE.conventional;
    this.store.setPriceMode(mode);
  }

  protected onYearChange(value: string | string[] | null): void {
    if (typeof value !== 'string') {
      return;
    }
    const parsed = parseYearValue(value);
    if (parsed !== null) {
      this.season.setYear(parsed);
    }
  }

  protected onSeasonChange(value: string | null): void {
    if (value !== null && isSeasonFilter(value)) {
      this.season.setSeason(value);
    }
  }

  protected onSavingsGroupChange(value: string | null): void {
    if (value === SAVINGS_GROUP.crop || value === SAVINGS_GROUP.variety) {
      this.savingsGroup.set(value);
    }
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

  protected readonly savingsChartOptions = computed<EChartsCoreOption>(() => {
    const source =
      this.savingsGroup() === SAVINGS_GROUP.variety
        ? this.store.savingsByVariety()
        : this.store.savingsByCrop();
    const top = source.slice(0, TOP_CROPS_COUNT);
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
