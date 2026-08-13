import { NgTemplateOutlet } from '@angular/common';
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
  type TemplateRef,
  ViewEncapsulation,
} from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { NgIcon, type IconName } from '@ng-icons/core';
import type { ClassValue } from 'clsx';

import { toggleVariants, type ToggleSizeVariants } from '../toggle/toggle.variants';
import { mergeClasses } from '../../utils/merge-classes';

import { toggleGroupItemVariants, toggleGroupVariants } from './toggle-group.variants';

export interface ToggleGroupItem {
  value: string;
  label?: string;
  icon?: IconName;
  template?: TemplateRef<void>;
  disabled?: boolean;
  ariaLabel?: string;
}

type OnTouchedType = () => void;
type OnChangeType = (value: string | string[]) => void;

@Component({
  selector: 'app-toggle-group',
  imports: [NgIcon, NgTemplateOutlet],
  template: `
    <div
      role="group"
      data-slot="toggle-group"
      [class]="classes()"
      data-variant="outline"
      [attr.data-size]="size()"
      [attr.data-orientation]="orientation()"
      [attr.data-horizontal]="orientation() === 'horizontal' || null"
      [attr.data-vertical]="orientation() === 'vertical' || null"
      [attr.data-spacing]="spacing()"
      [style.--gap]="spacing()"
    >
      @for (item of items(); track item.value) {
        <button
          type="button"
          data-slot="toggle-group-item"
          data-variant="outline"
          [attr.data-size]="size()"
          [attr.data-spacing]="spacing()"
          [attr.aria-pressed]="isItemPressed(item.value)"
          [attr.data-state]="isItemPressed(item.value) ? 'on' : 'off'"
          [attr.aria-label]="item.ariaLabel"
          [class]="itemClasses()"
          [disabled]="disabledState() || item.disabled"
          (click)="toggleItem(item)"
        >
          @if (item.template) {
            <ng-container [ngTemplateOutlet]="item.template" />
          } @else {
            @if (item.icon) {
              <ng-icon [name]="item.icon" class="size-4!" />
            }
            @if (item.label) {
              <span>{{ item.label }}</span>
            } @else if (!item.icon) {
              <span>{{ item.value }}</span>
            }
          }
        </button>
      }
    </div>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ToggleGroupComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'appToggleGroup',
})
export class ToggleGroupComponent implements ControlValueAccessor {
  readonly class = input<ClassValue>('');
  readonly defaultValue = input<string | string[]>();
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly mode = input<'single' | 'multiple'>('multiple');
  readonly itemClass = input<ClassValue>('');
  readonly items = input<ToggleGroupItem[]>([]);
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
  readonly size = input<ToggleSizeVariants>('default');
  readonly spacing = input(0);
  readonly value = input<string | string[]>();

  readonly valueChange = output<string | string[]>();

  protected readonly disabledState = linkedSignal(() => this.disabled());
  private readonly internalValue = signal<string | string[] | undefined>(undefined);

  protected readonly classes = computed(() => mergeClasses(toggleGroupVariants(), this.class()));

  protected readonly itemClasses = computed(() =>
    mergeClasses(
      toggleGroupItemVariants(),
      toggleVariants({
        type: 'outline',
        size: this.size(),
      }),
      this.itemClass(),
    ),
  );

  protected readonly currentValue = computed(() => {
    const internal = this.internalValue();
    const input = this.value();
    const defaultVal = this.defaultValue();

    if (internal !== undefined) {
      return internal;
    }
    if (input !== undefined) {
      return input;
    }
    if (defaultVal !== undefined) {
      return defaultVal;
    }

    return this.mode() === 'single' ? '' : [];
  });

  protected isItemPressed(itemValue: string): boolean {
    const current = this.currentValue();
    if (this.mode() === 'single') {
      return current === itemValue;
    }
    return Array.isArray(current) && current.includes(itemValue);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onTouched: OnTouchedType = () => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onChangeFn: OnChangeType = () => {};

  toggleItem(item: ToggleGroupItem) {
    if (this.disabledState() || item.disabled) {
      return;
    }

    const currentValue = this.currentValue();
    let newValue: string | string[];

    if (this.mode() === 'single') {
      newValue = currentValue === item.value ? '' : item.value;
    } else {
      const currentArray = Array.isArray(currentValue) ? currentValue : [];
      if (currentArray.includes(item.value)) {
        newValue = currentArray.filter(v => v !== item.value);
      } else {
        newValue = [...currentArray, item.value];
      }
    }

    this.internalValue.set(newValue);
    this.valueChange.emit(newValue);
    this.onChangeFn(newValue);
    this.onTouched();
  }

  writeValue(value: string | string[]): void {
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
