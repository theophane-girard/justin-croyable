import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
  type TemplateRef,
  ViewContainerRef,
  viewChild,
} from '@angular/core';

import {
  ButtonComponent,
  SelectImports,
  SheetService,
  SliderComponent,
  SwitchComponent,
} from '@justin-croyable/design-system';
import { NgIcon } from '@ng-icons/core';

import { type Stat, STAT_META, STAT_ORDER } from '../../core/pokemon.model';
import {
  DEFAULT_ENHANCE_CONFIG,
  type EnhanceConfig,
  EV_STEP,
  evsTotal,
  MAX_EV_PER_STAT,
  MAX_EV_TOTAL,
  NATURES,
  natureById,
  natureEffectLabel,
  NEUTRAL_NATURE_ID,
} from '../../core/pokemon-stats';

interface NatureOption {
  readonly id: string;
  readonly label: string;
  readonly effect: string;
}

@Component({
  selector: 'app-stat-enhancer',
  imports: [NgIcon, ButtonComponent, SwitchComponent, SliderComponent, ...SelectImports],
  template: `
    <button appButton type="button" variant="outline" size="sm" [full]="full()" (click)="open()">
      <ng-icon name="phosphorMagicWand" class="size-4" />
      Enhance
    </button>

    <ng-template #enhanceSheet>
      <div class="flex flex-col gap-6">
        <section class="flex items-center justify-between gap-4">
          <div class="flex flex-col">
            <span class="text-sm font-semibold">Simuler les stats au niveau 100</span>
            <span class="text-muted-foreground text-xs">IV parfaits (31), EV et nature appliqués.</span>
          </div>
          <app-switch
            [checked]="draftLevel100()"
            (checkedChange)="draftLevel100.set($event)"
          />
        </section>

        <section class="flex flex-col gap-2">
          <h3 class="text-sm font-semibold">Nature</h3>
          <app-select
            class="w-full"
            placeholder="Choisir une nature"
            [value]="draftNature()"
            [displayLabel]="draftNatureEffect()"
            [disabled]="!draftLevel100()"
            (selectionChange)="onNatureChange($event)"
          >
            @for (nature of natureOptions; track nature.id) {
              <app-select-item [value]="nature.id">
                {{ nature.label }} · {{ nature.effect }}
              </app-select-item>
            }
          </app-select>
        </section>

        <section class="flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-semibold">EV</h3>
            <span
              class="text-xs tabular-nums"
              [class]="draftEvsTotal() > maxEvTotal ? 'text-destructive' : 'text-muted-foreground'"
            >
              Total {{ draftEvsTotal() }} / {{ maxEvTotal }}
            </span>
          </div>

          @for (stat of statOrder; track stat) {
            <div class="flex flex-col gap-1">
              <div class="flex items-center justify-between">
                <span class="text-muted-foreground text-sm">{{ statMeta[stat].label }}</span>
                <span class="text-sm font-medium tabular-nums">{{ draftEvs()[stat] }}</span>
              </div>
              <app-slider
                [min]="0"
                [max]="maxEvPerStat"
                [step]="evStep"
                [default]="evSeed()[stat]"
                [disabled]="!draftLevel100()"
                (slideIndexChange)="onEvChange(stat, $event)"
              />
            </div>
          }
        </section>
      </div>
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatEnhancerComponent {
  readonly full = input<boolean>(false);

  readonly apply = output<EnhanceConfig>();

  readonly #sheet = inject(SheetService);
  readonly #viewContainerRef = inject(ViewContainerRef);

  private readonly enhanceTemplate = viewChild.required<TemplateRef<unknown>>('enhanceSheet');

  protected readonly statOrder = STAT_ORDER;
  protected readonly statMeta = STAT_META;
  protected readonly maxEvPerStat = MAX_EV_PER_STAT;
  protected readonly maxEvTotal = MAX_EV_TOTAL;
  protected readonly evStep = EV_STEP;
  protected readonly natureOptions: readonly NatureOption[] = NATURES.map(nature => ({
    id: nature.id,
    label: nature.label,
    effect: natureEffectLabel(nature),
  }));

  readonly #appliedConfig = signal<EnhanceConfig>(DEFAULT_ENHANCE_CONFIG);

  protected readonly draftLevel100 = signal<boolean>(DEFAULT_ENHANCE_CONFIG.level100);
  protected readonly draftNature = signal<string>(DEFAULT_ENHANCE_CONFIG.nature);
  protected readonly draftEvs = signal<Readonly<Record<Stat, number>>>(DEFAULT_ENHANCE_CONFIG.evs);
  protected readonly evSeed = signal<Readonly<Record<Stat, readonly number[]>>>(
    this.#seedFrom(DEFAULT_ENHANCE_CONFIG.evs),
  );

  protected readonly draftEvsTotal = computed(() => evsTotal(this.draftEvs()));
  protected readonly draftNatureEffect = computed(() =>
    natureEffectLabel(natureById(this.draftNature())),
  );

  #seedFrom(evs: Readonly<Record<Stat, number>>): Record<Stat, number[]> {
    return Object.fromEntries(STAT_ORDER.map(stat => [stat, [evs[stat]]])) as Record<
      Stat,
      number[]
    >;
  }

  protected open(): void {
    const config = this.#appliedConfig();
    this.draftLevel100.set(config.level100);
    this.draftNature.set(config.nature);
    this.draftEvs.set(config.evs);
    this.evSeed.set(this.#seedFrom(config.evs));
    this.#sheet.create({
      content: this.enhanceTemplate(),
      side: 'bottom',
      title: 'Enhance',
      okText: 'Valider',
      cancelText: 'Annuler',
      maskClosable: true,
      viewContainerRef: this.#viewContainerRef,
      customClasses: 'p-4',
      onOk: () => this.#applyDraft(),
    });
  }

  protected onNatureChange(value: string | string[]): void {
    const nature = Array.isArray(value) ? value[0] : value;
    this.draftNature.set(nature || NEUTRAL_NATURE_ID);
  }

  protected onEvChange(stat: Stat, values: number[]): void {
    const value = Math.max(0, Math.min(values[0] ?? 0, MAX_EV_PER_STAT));
    this.draftEvs.set({ ...this.draftEvs(), [stat]: value });
  }

  #applyDraft(): void {
    const config: EnhanceConfig = {
      level100: this.draftLevel100(),
      nature: this.draftNature(),
      evs: this.draftEvs(),
    };
    this.#appliedConfig.set(config);
    this.apply.emit(config);
  }
}
