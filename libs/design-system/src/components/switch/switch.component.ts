import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  output,
  ViewEncapsulation,
} from '@angular/core';
import type { FormCheckboxControl } from '@angular/forms/signals';

import type { ClassValue } from 'clsx';

import { IdDirective } from '../../core';
import { mergeClasses } from '../../utils/merge-classes';

import {
  switchVariants,
  type SwitchSizeVariants,
  type SwitchTypeVariants,
} from './switch.variants';

@Component({
  selector: 'app-switch',
  imports: [IdDirective],
  template: `
    <span class="flex items-center space-x-2" appId="switch" #z="appId">
      <button
        [id]="id() || z.id()"
        type="button"
        role="switch"
        [attr.data-state]="status()"
        [attr.aria-checked]="checked()"
        [class]="classes()"
        [disabled]="disabled()"
        (click)="onSwitchChange()"
        (blur)="touch.emit()"
      >
        <span
          [attr.data-size]="size()"
          [attr.data-state]="status()"
          class="bg-background pointer-events-none block size-5 rounded-full shadow-lg ring-0 transition-transform data-[size=lg]:size-6 data-[size=sm]:size-4 data-[state=checked]:translate-x-5 data-[size=lg]:data-[state=checked]:translate-x-6 data-[size=sm]:data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0 data-[size=lg]:data-[state=unchecked]:translate-x-0 data-[size=sm]:data-[state=unchecked]:translate-x-0"
        ></span>
      </button>

      <label
        class="cursor-pointer text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        [for]="id() || z.id()"
      >
        <ng-content><span class="sr-only">toggle switch</span></ng-content>
      </label>
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'switch',
})
export class SwitchComponent implements FormCheckboxControl {
  readonly class = input<ClassValue>('');
  readonly id = input<string>('');
  readonly size = input<SwitchSizeVariants>('default');
  readonly type = input<SwitchTypeVariants>('default');

  // Signal Forms contract (`FormCheckboxControl`): `checked` is the two-way model and
  // `disabled` is an `input()` that `[formField]` writes into.
  readonly checked = model<boolean>(true);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly touch = output<void>();

  protected readonly status = computed(() => (this.checked() ? 'checked' : 'unchecked'));
  protected readonly classes = computed(() =>
    mergeClasses(switchVariants({ type: this.type(), size: this.size() }), this.class()),
  );

  onSwitchChange(): void {
    if (this.disabled()) {
      return;
    }

    this.checked.update((checked) => !checked);
    this.touch.emit();
  }
}
