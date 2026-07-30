import {
  booleanAttribute,
  computed,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  linkedSignal,
  model,
  output,
  signal,
} from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';

import type { ClassValue } from 'clsx';

import { mergeClasses } from '../../utils/merge-classes';

import {
  inputVariants,
  type InputSizeVariants,
  type InputStatusVariants,
  type InputTypeVariants,
} from './input.variants';

type InputElement = HTMLInputElement | HTMLTextAreaElement;
type InputValue = string | number | null | undefined;

@Directive({
  selector: 'input[app-input], textarea[app-input]',
  host: {
    '[class]': 'classes()',
    '[disabled]': 'isDisabled()',
    '(input)': 'updateValue($event.target)',
    '(blur)': 'touch.emit()',
  },
  exportAs: 'input',
})
export class InputDirective implements FormValueControl<InputValue> {
  private readonly elementRef = inject<ElementRef<InputElement>>(ElementRef);

  readonly class = input<ClassValue>('');
  readonly borderless = input(false, { transform: booleanAttribute });
  readonly inputSize = input<InputSizeVariants>('default');
  readonly status = input<InputStatusVariants>();

  // Signal Forms contract (`FormValueControl`): `value` is the two-way model and the state
  // properties below are `input()`s that `[formField]` writes into. They must be `input()`
  // (not `model()`) — `[formField]` does not write to a `model()` — and reaching the DOM via
  // host bindings (rather than imperative writes) is also what makes them survive SSR hydration.
  readonly value = model<InputValue>(null);
  readonly disabled = input<boolean>(false);
  readonly touch = output<void>();

  // Imperative disabled state (e.g. set by the parent input-group via `disable()`).
  private readonly manualDisabled = signal(false);

  protected readonly isDisabled = computed(() => this.disabled() || this.manualDisabled());

  readonly size = linkedSignal<InputSizeVariants>(() => this.inputSize());

  protected readonly classes = computed(() =>
    mergeClasses(
      inputVariants({
        type: this.getType(),
        size: this.size(),
        status: this.status(),
        borderless: this.borderless(),
      }),
      this.class(),
    ),
  );

  constructor() {
    effect(() => {
      this.writeNativeValue(this.value());
    });
  }

  disable(b: boolean): void {
    this.manualDisabled.set(b);
  }

  setDataSlot(name: string): void {
    if (this.elementRef?.nativeElement?.dataset) {
      this.elementRef.nativeElement.dataset['slot'] = name;
    }
  }

  /** Assigns `id` only if the consumer hasn't set one, and returns the effective id. */
  ensureId(fallbackId: string): string {
    const el = this.elementRef.nativeElement;
    if (!el.id) {
      el.id = fallbackId;
    }
    return el.id;
  }

  setAriaDescribedBy(id: string | null): void {
    const el = this.elementRef.nativeElement;
    if (id) {
      el.setAttribute('aria-describedby', id);
    } else {
      el.removeAttribute('aria-describedby');
    }
  }

  setAriaInvalid(invalid: boolean): void {
    const el = this.elementRef.nativeElement;
    if (invalid) {
      el.setAttribute('aria-invalid', 'true');
    } else {
      el.removeAttribute('aria-invalid');
    }
  }

  protected updateValue(target: EventTarget | null): void {
    const el = target as InputElement | null;
    this.value.set(this.readNativeValue(el));
  }

  getType(): InputTypeVariants {
    const isTextarea = this.elementRef.nativeElement.tagName.toLowerCase() === 'textarea';
    return isTextarea ? 'textarea' : 'default';
  }

  private isNumericInput(element: InputElement): element is HTMLInputElement {
    return element.tagName.toLowerCase() === 'input' && ['number', 'range'].includes(element.type);
  }

  private readNativeValue(element: InputElement | null): InputValue {
    if (!element) {
      return '';
    }

    if (this.isNumericInput(element)) {
      const currentValue = this.value();

      if (typeof currentValue === 'number' || currentValue === null) {
        if (element.value === '') {
          return null;
        }

        const numericValue = element.valueAsNumber;
        return Number.isNaN(numericValue) ? null : numericValue;
      }
    }

    return element.value;
  }

  private writeNativeValue(value: InputValue): void {
    const element = this.elementRef.nativeElement;

    if (this.isNumericInput(element) && typeof value === 'number') {
      element.value = Number.isNaN(value) ? '' : String(value);
      return;
    }

    element.value = String(value ?? '');
  }
}
