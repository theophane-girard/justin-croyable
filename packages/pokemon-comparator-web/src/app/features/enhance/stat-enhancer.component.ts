import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
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
} from '@justin-croyable/design-system';
import { NgIcon } from '@ng-icons/core';

import { type Stat, STAT_META, STAT_ORDER } from '../../core/pokemon.model';
import {
  DEFAULT_ENHANCE_CONFIG,
  EV_STEP,
  evsTotal,
  MAX_EV_PER_STAT,
  maxEvForStat,
  NATURES,
  natureById,
  natureEffectLabel,
  NEUTRAL_NATURE_ID,
  USABLE_EV_TOTAL,
} from '../../core/pokemon-stats';
import { injectEnhanceUrl } from './enhance-url';

interface NatureOption {
  readonly id: string;
  readonly label: string;
  readonly effect: string;
}

@Component({
  selector: 'app-stat-enhancer',
  imports: [NgIcon, ButtonComponent, SliderComponent, ...SelectImports],
  template: `
    <button appButton type="button" variant="outline" size="default" [full]="full()" (click)="open()">
      <ng-icon name="phosphorMagicWand" class="size-4" />
      Enhance
    </button>

    <ng-template #enhanceSheet>
      <div class="flex flex-col gap-6">
        <p class="text-muted-foreground text-sm">
          À la validation, les statistiques sont calculées au niveau 100 avec des IV parfaits (31),
          selon la nature et les EV choisis ci-dessous.
        </p>

        <section class="flex flex-col gap-2">
          <h3 class="text-sm font-semibold">Nature</h3>
          <app-select
            class="w-full"
            placeholder="Choisir une nature"
            [value]="draftNature()"
            [displayLabel]="draftNatureEffect()"
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
            <span class="text-muted-foreground text-xs tabular-nums">
              Total {{ draftEvsTotal() }} / {{ usableEvTotal }}
            </span>
          </div>

          @for (stat of statOrder; track stat) {
            <div class="flex flex-col gap-1">
              <div class="flex items-center justify-between">
                <span class="text-muted-foreground text-sm">{{ statMeta[stat].label }}</span>
                <span class="text-sm font-medium tabular-nums">{{ draftEvs()[stat] }}</span>
              </div>
              <div class="flex items-center gap-2">
                <button
                  appButton
                  type="button"
                  variant="outline"
                  size="sm"
                  [attr.aria-label]="'EV minimum ' + statMeta[stat].label"
                  [buttonDisabled]="draftEvs()[stat] === 0"
                  (click)="setEv(stat, 0)"
                >
                  <ng-icon name="phosphorCaretLineLeft" class="size-4" />
                </button>
                <app-slider
                  class="flex-1"
                  [min]="0"
                  [max]="maxEvPerStat"
                  [step]="evStep"
                  [value]="evValues()[stat]"
                  (slideIndexChange)="onEvChange(stat, $event)"
                />
                <button
                  appButton
                  type="button"
                  variant="outline"
                  size="sm"
                  [attr.aria-label]="'EV maximum ' + statMeta[stat].label"
                  [buttonDisabled]="evMax()[stat] === draftEvs()[stat]"
                  (click)="setEv(stat, evMax()[stat])"
                >
                  <ng-icon name="phosphorCaretLineRight" class="size-4" />
                </button>
              </div>
            </div>
          }
        </section>

        <div class="flex justify-end">
          <button appButton type="button" variant="ghost" size="sm" (click)="reset()">
            <ng-icon name="phosphorArrowClockwise" class="size-4" />
            Réinitialiser
          </button>
        </div>
      </div>
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatEnhancerComponent {
  readonly full = input<boolean>(false);

  readonly #enhance = injectEnhanceUrl();
  readonly #sheet = inject(SheetService);
  readonly #viewContainerRef = inject(ViewContainerRef);

  private readonly enhanceTemplate = viewChild.required<TemplateRef<unknown>>('enhanceSheet');

  protected readonly statOrder = STAT_ORDER;
  protected readonly statMeta = STAT_META;
  protected readonly maxEvPerStat = MAX_EV_PER_STAT;
  protected readonly usableEvTotal = USABLE_EV_TOTAL;
  protected readonly evStep = EV_STEP;
  protected readonly natureOptions: readonly NatureOption[] = NATURES.map(nature => ({
    id: nature.id,
    label: nature.label,
    effect: natureEffectLabel(nature),
  }));

  protected readonly draftNature = signal<string>(DEFAULT_ENHANCE_CONFIG.nature);
  protected readonly draftEvs = signal<Readonly<Record<Stat, number>>>(DEFAULT_ENHANCE_CONFIG.evs);

  protected readonly draftEvsTotal = computed(() => evsTotal(this.draftEvs()));
  protected readonly draftNatureEffect = computed(() =>
    natureEffectLabel(natureById(this.draftNature())),
  );
  protected readonly evValues = computed<Record<Stat, number[]>>(() => {
    const evs = this.draftEvs();
    return Object.fromEntries(STAT_ORDER.map(stat => [stat, [evs[stat]]])) as Record<
      Stat,
      number[]
    >;
  });
  protected readonly evMax = computed<Record<Stat, number>>(() => {
    const evs = this.draftEvs();
    const total = evsTotal(evs);
    return Object.fromEntries(
      STAT_ORDER.map(stat => [stat, maxEvForStat(evs[stat], total)]),
    ) as Record<Stat, number>;
  });

  protected open(): void {
    const config = this.#enhance.config();
    this.draftNature.set(config.nature);
    this.draftEvs.set(config.evs);
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

  protected reset(): void {
    this.draftNature.set(DEFAULT_ENHANCE_CONFIG.nature);
    this.draftEvs.set(DEFAULT_ENHANCE_CONFIG.evs);
    this.#enhance.patch(DEFAULT_ENHANCE_CONFIG);
  }

  protected onNatureChange(value: string | string[]): void {
    const nature = Array.isArray(value) ? value[0] : value;
    this.draftNature.set(nature || NEUTRAL_NATURE_ID);
  }

  protected onEvChange(stat: Stat, values: number[]): void {
    this.setEv(stat, values[0] ?? 0);
  }

  protected setEv(stat: Stat, value: number): void {
    const evs = this.draftEvs();
    const max = maxEvForStat(evs[stat], evsTotal(evs));
    const bounded = Math.max(0, Math.min(value, max));
    this.draftEvs.set({ ...evs, [stat]: bounded });
  }

  #applyDraft(): void {
    this.#enhance.patch({
      level100: true,
      nature: this.draftNature(),
      evs: this.draftEvs(),
    });
  }
}
