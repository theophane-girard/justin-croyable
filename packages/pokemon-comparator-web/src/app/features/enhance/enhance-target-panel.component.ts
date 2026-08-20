import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { ButtonComponent, SelectImports, SliderComponent } from '@justin-croyable/design-system';
import { NgIcon } from '@ng-icons/core';

import { type Stat, STAT_META, STAT_ORDER } from '../../core/pokemon.model';
import {
  applyEnhancedStats,
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

interface NatureOption {
  readonly id: string;
  readonly label: string;
  readonly effect: string;
}

export interface EvChange {
  readonly stat: Stat;
  readonly value: number;
}

@Component({
  selector: 'app-enhance-target-panel',
  imports: [NgIcon, ButtonComponent, SliderComponent, ...SelectImports],
  template: `
    <div class="flex flex-col gap-5">
      <section class="flex flex-col gap-2">
        <h3 class="text-sm font-semibold">Nature</h3>
        <app-select
          class="w-full"
          placeholder="Choisir une nature"
          [value]="nature()"
          [displayLabel]="natureEffect()"
          (selectionChange)="onNatureChange($event)"
        >
          @for (option of natureOptions; track option.id) {
            <app-select-item [value]="option.id">{{ option.label }} · {{ option.effect }}</app-select-item>
          }
        </app-select>
      </section>

      <section class="flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold">EV</h3>
          <span class="text-muted-foreground text-xs tabular-nums">
            Total {{ evTotal() }} / {{ usableEvTotal }}
          </span>
        </div>

        @for (stat of statOrder; track stat) {
          <div class="flex flex-col gap-1">
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground text-sm">{{ statMeta[stat].label }}</span>
              @if (statValues(); as stats) {
                <span class="flex items-baseline gap-2 tabular-nums">
                  <span class="text-sm font-semibold">{{ stats[stat] }}</span>
                  <span class="text-muted-foreground text-xs">{{ evs()[stat] }} EV</span>
                </span>
              } @else {
                <span class="text-sm font-medium tabular-nums">{{ evs()[stat] }}</span>
              }
            </div>
            <div class="flex items-center gap-2">
              <button
                appButton
                type="button"
                variant="outline"
                size="sm"
                [attr.aria-label]="'EV minimum ' + statMeta[stat].label"
                [buttonDisabled]="evs()[stat] === 0"
                (click)="emitEv(stat, 0)"
              >
                <ng-icon name="phosphorCaretLineLeft" class="size-4" />
              </button>
              <app-slider
                class="flex-1"
                [min]="0"
                [max]="maxEvPerStat"
                [step]="evStep"
                [value]="evValues()[stat]"
                (slideIndexChange)="onSlider(stat, $event)"
              />
              <button
                appButton
                type="button"
                variant="outline"
                size="sm"
                [attr.aria-label]="'EV maximum ' + statMeta[stat].label"
                [buttonDisabled]="evMax()[stat] === evs()[stat]"
                (click)="emitEv(stat, evMax()[stat])"
              >
                <ng-icon name="phosphorCaretLineRight" class="size-4" />
              </button>
            </div>
          </div>
        }
      </section>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnhanceTargetPanelComponent {
  readonly nature = input.required<string>();
  readonly evs = input.required<Readonly<Record<Stat, number>>>();
  readonly displayStats = input(false);
  readonly baseStats = input<Readonly<Record<Stat, number>> | null>(null);

  readonly natureChange = output<string>();
  readonly evChange = output<EvChange>();

  protected readonly statOrder = STAT_ORDER;
  protected readonly statMeta = STAT_META;
  protected readonly maxEvPerStat = MAX_EV_PER_STAT;
  protected readonly usableEvTotal = USABLE_EV_TOTAL;
  protected readonly evStep = EV_STEP;
  protected readonly natureOptions: readonly NatureOption[] = NATURES.map(option => ({
    id: option.id,
    label: option.label,
    effect: natureEffectLabel(option),
  }));

  protected readonly natureEffect = computed(() => natureEffectLabel(natureById(this.nature())));
  protected readonly statValues = computed<Readonly<Record<Stat, number>> | null>(() => {
    const base = this.baseStats();
    if (!this.displayStats() || !base) {
      return null;
    }
    return applyEnhancedStats(base, { level100: true, nature: this.nature(), evs: this.evs() });
  });
  protected readonly evTotal = computed(() => evsTotal(this.evs()));
  protected readonly evValues = computed<Record<Stat, number[]>>(() => {
    const evs = this.evs();
    return Object.fromEntries(STAT_ORDER.map(stat => [stat, [evs[stat]]])) as Record<Stat, number[]>;
  });
  protected readonly evMax = computed<Record<Stat, number>>(() => {
    const evs = this.evs();
    const total = evsTotal(evs);
    return Object.fromEntries(
      STAT_ORDER.map(stat => [stat, maxEvForStat(evs[stat], total)]),
    ) as Record<Stat, number>;
  });

  protected onNatureChange(value: string | string[]): void {
    const nature = Array.isArray(value) ? value[0] : value;
    this.natureChange.emit(nature || NEUTRAL_NATURE_ID);
  }

  protected onSlider(stat: Stat, values: number[]): void {
    this.emitEv(stat, values[0] ?? 0);
  }

  protected emitEv(stat: Stat, value: number): void {
    this.evChange.emit({ stat, value });
  }
}
