import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  inject,
  input,
  model,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import type { ClassValue } from 'clsx';

import { IdDirective } from '../../core';
import { mergeClasses, noopFn } from '../../utils/merge-classes';

import { radioGroupVariants, radioVariants } from './radio-group.variants';

type OnTouchedType = () => void;
type OnChangeType = (value: unknown) => void;

@Component({
  selector: 'app-radio-group, [app-radio-group]',
  template: '<ng-content />',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RadioGroupComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    role: 'radiogroup',
    'data-slot': 'radio-group',
    '[attr.aria-disabled]': 'isDisabled() ? "true" : null',
    '[class]': 'classes()',
  },
  exportAs: 'appRadioGroup',
})
export class RadioGroupComponent implements ControlValueAccessor {
  readonly class = input<ClassValue>('');
  readonly value = model<unknown>(null);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly name = input<string>('');

  protected readonly formDisabled = signal(false);
  protected readonly classes = computed(() => mergeClasses(radioGroupVariants(), this.class()));
  readonly isDisabled = computed(() => this.disabled() || this.formDisabled());

  private onChange: OnChangeType = noopFn;
  private onTouched: OnTouchedType = noopFn;

  select(value: unknown): void {
    if (this.isDisabled()) return;
    this.value.set(value);
    this.onChange(value);
    this.onTouched();
  }

  isSelected(value: unknown): boolean {
    return this.value() === value;
  }

  writeValue(val: unknown): void {
    this.value.set(val);
  }

  registerOnChange(fn: OnChangeType): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: OnTouchedType): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }
}

@Component({
  selector: 'app-radio, [app-radio]',
  imports: [IdDirective],
  template: `
    <button
      [id]="id() || z.id()"
      type="button"
      role="radio"
      [attr.data-state]="checked() ? 'checked' : 'unchecked'"
      [attr.data-checked]="checked() ? '' : null"
      [attr.aria-checked]="checked()"
      [attr.aria-invalid]="invalid() ? 'true' : null"
      [class]="classes()"
      [disabled]="disabledState()"
      (click)="onSelect()"
      appId="radio"
      #z="appId"
    >
      @if (checked()) {
        <span data-slot="radio-group-indicator" class="flex size-4 items-center justify-center">
          <span
            class="bg-primary-foreground absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          ></span>
        </span>
      }
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'appRadio',
})
export class RadioComponent {
  private readonly group = inject(RadioGroupComponent, { optional: true });

  readonly class = input<ClassValue>('');
  readonly value = input<unknown>(null);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly id = input<string>('');

  protected readonly checked = computed(() => this.group!.isSelected(this.value()));
  protected readonly disabledState = computed(() => this.disabled() || this.group!.isDisabled());
  protected readonly classes = computed(() => mergeClasses(radioVariants(), this.class()));

  constructor() {
    if (!this.group) {
      throw new Error('<app-radio> must be used inside a <app-radio-group>.');
    }
  }

  onSelect(): void {
    if (this.disabledState()) return;
    this.group!.select(this.value());
  }
}
