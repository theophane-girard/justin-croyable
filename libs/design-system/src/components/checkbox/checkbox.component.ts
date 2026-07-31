import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  forwardRef,
  input,
  output,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck } from '@ng-icons/lucide';
import type { ClassValue } from 'clsx';

import { IdDirective } from '../../core';
import { mergeClasses, noopFn } from '../../utils/merge-classes';

import { checkboxLabelVariants, checkboxVariants } from './checkbox.variants';

type OnTouchedType = () => void;
type OnChangeType = (value: boolean) => void;

@Component({
  selector: 'app-checkbox, [app-checkbox]',
  imports: [NgIcon, IdDirective],
  template: `
    <span class="relative flex" appId="checkbox" #z="appId">
      <input
        #input
        type="checkbox"
        name="checkbox"
        [id]="id() || z.id()"
        [class]="classes()"
        [checked]="checked()"
        [disabled]="disabledState()"
        [attr.data-state]="checked() ? 'checked' : 'unchecked'"
        [attr.data-checked]="checked() ? '' : null"
        [attr.aria-invalid]="invalid() ? 'true' : null"
        (blur)="onCheckboxBlur()"
        (click)="onCheckboxChange()"
      />
      <ng-icon
        name="lucideCheck"
        class="text-primary-foreground pointer-events-none absolute top-1/2 left-1/2 flex -translate-1/2 items-center justify-center transition-opacity"
        [class]="checked() ? 'opacity-100' : 'opacity-0'"
      />
    </span>
    <label [class]="labelClasses()" [for]="id() || z.id()">
      <ng-content />
    </label>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckboxComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  viewProviders: [provideIcons({ lucideCheck })],
  host: {
    'data-slot': 'checkbox',
    '[class]': "(disabledState() ? 'cursor-not-allowed' : 'cursor-pointer') + ' flex items-center gap-2'",
    '[attr.aria-disabled]': 'disabledState() ? "true" : null',
    '[attr.aria-invalid]': 'invalid() ? "true" : null',
    '[attr.data-checked]': "checked() ? '' : null",
    '[attr.data-state]': "checked() ? 'checked' : 'unchecked'",
  },
  exportAs: 'appCheckbox',
})
export class CheckboxComponent implements ControlValueAccessor {
  readonly checkChange = output<boolean>();

  readonly class = input<ClassValue>('');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly id = input<string>('');

  private onChange: OnChangeType = noopFn;
  private onTouched: OnTouchedType = noopFn;

  protected readonly classes = computed(() => mergeClasses(checkboxVariants(), this.class()));

  readonly disabledByForm = signal(false);
  protected readonly labelClasses = computed(() => mergeClasses(checkboxLabelVariants()));
  protected readonly disabledState = computed(() => this.disabled() || this.disabledByForm());
  readonly checked = signal(false);

  writeValue(val: boolean): void {
    this.checked.set(val);
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabledByForm.set(isDisabled);
  }

  registerOnChange(fn: OnChangeType): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: OnTouchedType): void {
    this.onTouched = fn;
  }

  onCheckboxBlur(): void {
    this.onTouched();
  }

  onCheckboxChange(): void {
    if (this.disabledState()) {
      return;
    }

    this.checked.update(v => !v);
    this.onChange(this.checked());
    this.checkChange.emit(this.checked());
  }
}
