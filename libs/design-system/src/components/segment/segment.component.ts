import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  linkedSignal,
  output,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { NgIcon, type IconName } from '@ng-icons/core';
import type { ClassValue } from 'clsx';

import { mergeClasses } from '../../utils/merge-classes';

import {
  segmentIndicatorVariants,
  segmentItemVariants,
  segmentVariants,
  type SegmentSize,
  type SegmentVariant,
} from './segment.variants';

export interface SegmentItem {
  value: string;
  label?: string;
  icon?: IconName;
  disabled?: boolean;
  ariaLabel?: string;
}

type OnTouchedType = () => void;
type OnChangeType = (value: string) => void;

@Component({
  selector: 'app-segment',
  imports: [NgIcon],
  template: `
    <div
      role="radiogroup"
      data-slot="segment"
      [class]="classes()"
      [attr.data-variant]="variant()"
      [attr.data-size]="size()"
      [attr.data-disabled]="disabledState() || null"
    >
      <div
        aria-hidden="true"
        data-slot="segment-indicator"
        [class]="indicatorClasses()"
        [class.opacity-0]="activeIndex() < 0"
        [style.width]="indicatorWidth()"
        [style.transform]="indicatorTransform()"
      ></div>

      @for (item of items(); track item.value; let index = $index) {
        <button
          type="button"
          role="radio"
          data-slot="segment-item"
          [attr.aria-checked]="activeIndex() === index"
          [attr.aria-label]="item.ariaLabel ?? item.label"
          [attr.data-state]="activeIndex() === index ? 'on' : 'off'"
          [attr.tabindex]="activeIndex() === index ? 0 : -1"
          [class]="itemClasses()[index]"
          [disabled]="disabledState() || item.disabled"
          (click)="select(item)"
        >
          @if (item.icon) {
            <ng-icon class="shrink-0" [name]="item.icon" />
          }
          @if (item.label) {
            <span [class]="item.icon ? 'hidden sm:inline' : ''">{{ item.label }}</span>
          } @else if (!item.icon) {
            <span>{{ item.value }}</span>
          }
        </button>
      }
    </div>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SegmentComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'appSegment',
})
export class SegmentComponent implements ControlValueAccessor {
  readonly items = input<SegmentItem[]>([]);
  readonly value = input<string>();
  readonly defaultValue = input<string>();
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly variant = input<SegmentVariant>('default');
  readonly size = input<SegmentSize>('default');
  readonly class = input<ClassValue>('');
  readonly itemClass = input<ClassValue>('');

  readonly valueChange = output<string>();

  protected readonly disabledState = linkedSignal(() => this.disabled());
  private readonly internalValue = signal<string | undefined>(undefined);

  protected readonly currentValue = computed(() => {
    const internal = this.internalValue();
    if (internal !== undefined) {
      return internal;
    }
    const controlled = this.value();
    if (controlled !== undefined) {
      return controlled;
    }
    const fallback = this.defaultValue();
    if (fallback !== undefined) {
      return fallback;
    }
    return this.items()[0]?.value ?? '';
  });

  protected readonly activeIndex = computed(() =>
    this.items().findIndex(item => item.value === this.currentValue()),
  );

  protected readonly indicatorWidth = computed(() => {
    const count = this.items().length;
    if (count === 0) {
      return '0';
    }
    return `calc((100% - 0.5rem) / ${count})`;
  });

  protected readonly indicatorTransform = computed(
    () => `translateX(calc(${Math.max(this.activeIndex(), 0)} * 100%))`,
  );

  protected readonly classes = computed(() =>
    mergeClasses(segmentVariants({ variant: this.variant(), size: this.size() }), this.class()),
  );

  protected readonly indicatorClasses = computed(() =>
    segmentIndicatorVariants({ variant: this.variant() }),
  );

  protected readonly itemClasses = computed(() => {
    const active = this.activeIndex();
    const variant = this.variant();
    const size = this.size();
    const itemClass = this.itemClass();
    return this.items().map((_, index) =>
      mergeClasses(
        segmentItemVariants({ variant, size, active: active === index }),
        itemClass,
      ),
    );
  });

  private onTouched: OnTouchedType = () => void 0;
  private onChangeFn: OnChangeType = () => void 0;

  protected select(item: SegmentItem): void {
    if (this.disabledState() || item.disabled || item.value === this.currentValue()) {
      return;
    }
    this.internalValue.set(item.value);
    this.valueChange.emit(item.value);
    this.onChangeFn(item.value);
    this.onTouched();
  }

  writeValue(value: string): void {
    if (value !== undefined) {
      this.internalValue.set(value);
    }
  }

  registerOnChange(fn: OnChangeType): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: OnTouchedType): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabledState.set(isDisabled);
  }
}
