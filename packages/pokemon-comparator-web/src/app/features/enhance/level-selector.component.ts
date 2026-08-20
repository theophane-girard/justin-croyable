import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { ButtonComponent, SliderComponent } from '@justin-croyable/design-system';
import { NgIcon } from '@ng-icons/core';

import { clampLevel, DEFAULT_LEVEL, MAX_LEVEL, MIN_LEVEL } from '../../core/pokemon-stats';

@Component({
  selector: 'app-level-selector',
  imports: [NgIcon, ButtonComponent, SliderComponent],
  template: `
    <div class="flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold">Niveau</h3>
        <span class="text-sm font-semibold tabular-nums">{{ level() }}</span>
      </div>
      <div class="flex items-center gap-2">
        <button
          appButton
          type="button"
          variant="outline"
          size="sm"
          aria-label="Diminuer le niveau"
          [buttonDisabled]="level() <= min"
          (click)="emit(level() - 1)"
        >
          <ng-icon name="phosphorMinus" class="size-4" />
        </button>
        <app-slider
          class="flex-1"
          [min]="min"
          [max]="max"
          [step]="1"
          [value]="sliderValue()"
          (slideIndexChange)="onSlide($event)"
        />
        <button
          appButton
          type="button"
          variant="outline"
          size="sm"
          aria-label="Augmenter le niveau"
          [buttonDisabled]="level() >= max"
          (click)="emit(level() + 1)"
        >
          <ng-icon name="phosphorPlus" class="size-4" />
        </button>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LevelSelectorComponent {
  readonly level = input.required<number>();
  readonly levelChange = output<number>();

  protected readonly min = MIN_LEVEL;
  protected readonly max = MAX_LEVEL;

  protected readonly sliderValue = computed<number[]>(() => [this.level()]);

  protected onSlide(values: number[]): void {
    this.emit(values[0] ?? DEFAULT_LEVEL);
  }

  protected emit(level: number): void {
    this.levelChange.emit(clampLevel(level));
  }
}
