import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  linkedSignal,
  model,
  output,
  ViewEncapsulation,
} from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import type { ClassValue } from 'clsx';

import { mergeClasses } from '../../utils/merge-classes';

import { toggleVariants, type ToggleSizeVariants, type ToggleTypeVariants } from './toggle.variants';

type OnTouchedType = () => void;
type OnChangeType = (value: boolean) => void;

@Component({
  selector: 'app-toggle',
  template: `
    <button
      type="button"
      data-slot="toggle"
      [attr.aria-label]="ariaLabel()"
      [attr.aria-pressed]="value()"
      [attr.data-state]="state()"
      [class]="classes()"
      [disabled]="disabledState()"
      (click)="toggle()"
    >
      <ng-content />
    </button>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ToggleComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '(mouseenter)': 'handleHover()',
  },
  exportAs: 'appToggle',
})
export class ToggleComponent implements ControlValueAccessor {
  readonly value = model(false);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly type = input<ToggleTypeVariants>('default');
  readonly size = input<ToggleSizeVariants>('default');
  readonly ariaLabel = input.required<string>();
  readonly class = input<ClassValue>('');

  readonly toggleClick = output<void>();
  readonly toggleHover = output<void>();
  readonly toggleChange = output<boolean>();

  protected readonly state = computed(() => (this.value() ? 'on' : 'off'));

  protected readonly disabledState = linkedSignal(() => this.disabled());

  protected readonly classes = computed(() =>
    mergeClasses(toggleVariants({ size: this.size(), type: this.type() }), this.class()),
  );

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onTouched: OnTouchedType = () => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onChangeFn: OnChangeType = () => {};

  handleHover() {
    this.toggleHover.emit();
  }

  toggle() {
    if (this.disabledState()) {
      return;
    }

    this.value.update(v => !v);

    this.toggleClick.emit();
    this.toggleChange.emit(this.value());
    this.onChangeFn(this.value());
    this.onTouched();
  }

  writeValue(val: boolean): void {
    this.value.set(val);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registerOnChange(fn: any): void {
    this.onChangeFn = fn;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabledState.set(isDisabled);
  }
}
