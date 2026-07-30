import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  output,
  viewChild,
  ViewEncapsulation,
  type TemplateRef,
} from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCalendar } from '@ng-icons/lucide';
import type { ClassValue } from 'clsx';

import { ButtonComponent, type ButtonVariant } from '../button';
import { CalendarComponent } from '../calendar';
import type { DatePickerSizeVariants } from './date-picker.variants';
import { PopoverComponent, PopoverDirective } from '../popover';
import { mergeClasses } from '../../utils/merge-classes';

/**
 * Height overrides for date-picker sizes.
 *
 * These heights intentionally differ from button size variants to accommodate
 * the date-picker UI:
 * - default: h-9 (vs button h-8)
 * - lg: h-11 (vs button h-9)
 *
 * The `mergeClasses` utility (tailwind-merge) resolves class conflicts,
 * allowing these values to override the base button heights defined in
 * `DatePickerSizeVariants`.
 */
const HEIGHT_BY_SIZE: Record<DatePickerSizeVariants, string> = {
  xs: 'h-7',
  sm: 'h-8',
  default: 'h-9',
  lg: 'h-11',
};

@Component({
  selector: 'app-date-picker, [app-date-picker]',
  imports: [NgIcon, ButtonComponent, CalendarComponent, PopoverComponent, PopoverDirective],
  template: `
    <button
      appButton
      type="button"
      [variant]="type()"
      [size]="size()"
      [disabled]="disabled()"
      [class]="buttonClasses()"
      appPopover
      #popoverDirective="appPopover"
      [content]="calendarTemplate"
      trigger="click"
      (visibleChange)="onPopoverVisibilityChange($event)"
      [attr.aria-expanded]="false"
      [attr.aria-haspopup]="true"
      aria-label="Choose date"
    >
      <ng-icon name="lucideCalendar" class="size-4!" />
      <span [class]="textClasses()">
        {{ displayText() }}
      </span>
    </button>

    <ng-template #calendarTemplate>
      <app-popover [class]="popoverClasses()">
        <app-calendar
          #calendar
          class="border-0"
          [value]="value()"
          [minDate]="minDate()"
          [maxDate]="maxDate()"
          [disabled]="disabled()"
          (dateChange)="onDateChange($event)"
        />
      </app-popover>
    </ng-template>
  `,
  providers: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  viewProviders: [provideIcons({ lucideCalendar })],
  host: {
    '[class]': 'class()',
  },
  exportAs: 'datePicker',
})
export class DatePickerComponent implements FormValueControl<Date | null> {
  private readonly datePipe = inject(DatePipe);

  readonly calendarTemplate = viewChild.required<TemplateRef<unknown>>('calendarTemplate');
  readonly popoverDirective = viewChild.required<PopoverDirective>('popoverDirective');
  readonly calendar = viewChild.required<CalendarComponent>('calendar');

  readonly class = input<ClassValue>('');
  readonly type = input<ButtonVariant>('outline');
  readonly size = input<DatePickerSizeVariants>('default');
  readonly placeholder = input<string>('Pick a date');
  readonly format = input<string>('MMMM d, yyyy');
  readonly minDate = input<Date | null>(null);
  readonly maxDate = input<Date | null>(null);

  // Signal Forms contract (`FormValueControl`): `value` is the two-way model and `disabled`
  // is an `input()` that `[formField]` writes into.
  readonly value = model<Date | null>(null);
  readonly disabled = input<boolean>(false);
  readonly touch = output<void>();

  readonly dateChange = output<Date | null>();

  protected readonly buttonClasses = computed(() => {
    const hasValue = !!this.value();
    const size = this.size();
    const height = HEIGHT_BY_SIZE[size];
    return mergeClasses(
      'justify-start text-left font-normal',
      !hasValue && 'text-muted-foreground',
      height,
      'w-full min-w-60',
    );
  });

  protected readonly textClasses = computed(() => {
    const hasValue = !!this.value();
    return mergeClasses(!hasValue && 'text-muted-foreground');
  });

  protected readonly popoverClasses = computed(() => mergeClasses('w-auto p-0'));

  protected readonly displayText = computed(() => {
    const date = this.value();
    if (!date) {
      return this.placeholder();
    }
    return this.formatDate(date, this.format());
  });

  protected onDateChange(date: Date | Date[]): void {
    // Date picker always uses single mode, so we can safely cast
    const singleDate = Array.isArray(date) ? (date[0] ?? null) : date;
    this.value.set(singleDate);
    this.touch.emit();
    this.dateChange.emit(singleDate);

    this.popoverDirective().hide();
  }

  protected onPopoverVisibilityChange(visible: boolean): void {
    if (visible) {
      setTimeout(() => {
        if (this.calendar()) {
          this.calendar().resetNavigation();
        }
      });
    }
  }

  private formatDate(date: Date, format: string): string {
    return this.datePipe.transform(date, format) ?? '';
  }
}
