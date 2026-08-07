import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  forwardRef,
  inject,
  Injector,
  input,
  linkedSignal,
  output,
  runInInjectionContext,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { type ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import type { Field } from '@angular/forms/signals';

import { NgIcon, provideIcons, type IconName } from '@ng-icons/core';
import { lucideCheck, lucideChevronsUpDown } from '@ng-icons/lucide';
import type { ClassValue } from 'clsx';

import { ButtonComponent, type ButtonVariant } from '../button';
import {
  comboboxVariants,
  type ComboboxWidthVariants,
} from './combobox.variants';
import {
  CommandComponent,
  CommandEmptyComponent,
  CommandInputComponent,
  CommandListComponent,
  CommandOptionComponent,
  CommandOptionGroupComponent,
  type CommandOption,
} from '../command';
import { EmptyComponent } from '../empty';
import { PopoverComponent, PopoverDirective } from '../popover';
import { SheetHandleComponent } from '../sheet-handle';
import { IdDirective } from '../../core';
import {
  MOBILE_SHEET_CONTENT_CLASSES,
  MOBILE_SHEET_ENTER_CLASSES,
  ViewportService,
} from '../../core/services/viewport.service';
import {
  fieldLabelClasses,
  fieldMessage,
  fieldMessageClasses,
} from '../../utils/field-message';
import { mergeClasses } from '../../utils/merge-classes';

export interface ComboboxOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: IconName;
}

export interface ComboboxGroup {
  label?: string;
  options: ComboboxOption[];
}

@Component({
  selector: 'app-combobox',
  imports: [
    FormsModule,
    NgTemplateOutlet,
    NgIcon,
    ButtonComponent,
    CommandComponent,
    CommandInputComponent,
    CommandListComponent,
    CommandEmptyComponent,
    CommandOptionComponent,
    CommandOptionGroupComponent,
    PopoverDirective,
    PopoverComponent,
    EmptyComponent,
    IdDirective,
    SheetHandleComponent,
  ],
  template: `
    @if (label()) {
      <label [id]="labelId()" [class]="labelClasses()">
        {{ label() }}
        @if (required()) {
          <span class="text-destructive" aria-hidden="true">*</span>
        }
      </label>
    }

    <ng-container appId="combobox" #z="appId" />

    <button
      type="button"
      appButton
      appPopover
      [mobileSheet]="true"
      role="combobox"
      [content]="popoverContent"
      [variant]="buttonVariant()"
      [class]="buttonClasses()"
      [buttonDisabled]="disabledState()"
      [attr.aria-expanded]="open()"
      [attr.aria-haspopup]="'listbox'"
      [attr.aria-controls]="'combobox-listbox'"
      [attr.aria-labelledby]="label() ? labelId() : null"
      [attr.aria-label]="label() ? null : ariaLabel() || 'Select option'"
      [attr.aria-required]="required() || null"
      [attr.aria-invalid]="showError() || null"
      [attr.aria-describedby]="describedBy()"
      [attr.aria-autocomplete]="searchable() ? 'list' : 'none'"
      [attr.aria-activedescendant]="null"
      (visibleChange)="setOpen($event)"
      #popoverTrigger
    >
      @if (prefixIcon()) {
        <ng-icon [name]="prefixIcon()" class="text-muted-foreground mr-2 shrink-0" />
      }
      <span class="flex-1 truncate text-left">
        {{ displayValue() ?? placeholder() }}
      </span>
      <ng-icon name="lucideChevronsUpDown" class="ml-2 shrink-0 opacity-50" />
    </button>

    @let message = errorMessage();
    @if (message) {
      <p [id]="messageId()" [class]="messageClasses(true)" role="alert" aria-live="polite">
        {{ message }}
      </p>
    } @else if (hint()) {
      <p [id]="messageId()" [class]="messageClasses(false)">{{ hint() }}</p>
    }

    <ng-template #popoverContent>
      <app-popover #popoverCmp [class]="popoverClasses()">
        @if (isMobile()) {
          <div class="bg-popover sticky top-0 z-10">
            <app-sheet-handle
              [sheetElement]="popoverCmp.elementRef.nativeElement"
              (dismissed)="dismissFromHandle()"
            />
            @if (sheetHeader()) {
              <div class="text-foreground border-b px-3 py-3 text-sm font-medium">
                {{ sheetHeader() }}
              </div>
            }
          </div>
        }
        <app-command class="min-h-auto" (commandSelected)="handleSelect($event)" #commandRef>
          @if (searchable()) {
            <app-command-input [placeholder]="searchPlaceholder()" #commandInputRef />
          }

          <app-command-list id="combobox-listbox" role="listbox">
            @if (emptyText()) {
              <app-command-empty>
                <app-empty [description]="emptyText()" />
              </app-command-empty>
            }

            @for (group of groups(); track group.label ?? $index) {
              @if (group.label) {
                <app-command-option-group [label]="group.label" #commandGroup>
                  @for (option of group.options; track option.value) {
                    <ng-container
                      [ngTemplateOutlet]="commandOption"
                      [ngTemplateOutletContext]="{
                        $implicit: option,
                        commandInstance: commandRef,
                        groupInstance: commandGroup,
                      }"
                    />
                  }
                </app-command-option-group>
              } @else {
                @for (option of group.options; track option.value) {
                  <ng-container
                    [ngTemplateOutlet]="commandOption"
                    [ngTemplateOutletContext]="{
                      $implicit: option,
                      commandInstance: commandRef,
                    }"
                  />
                }
              }
            } @empty {
              @if (options().length > 0) {
                @for (option of options(); track option.value) {
                  <ng-container
                    [ngTemplateOutlet]="commandOption"
                    [ngTemplateOutletContext]="{
                      $implicit: option,
                      commandInstance: commandRef,
                    }"
                  />
                }
              }
            }
          </app-command-list>
        </app-command>
      </app-popover>
    </ng-template>

    <ng-template #commandOption let-option let-cmd="commandInstance" let-grp="groupInstance">
      <app-command-option
        [value]="option.value"
        [label]="option.label"
        [disabled]="option.disabled ?? false"
        [icon]="option.icon"
        [parentCommand]="cmd"
        [commandGroup]="grp"
        [attr.aria-selected]="option.value === currentValue()"
      >
        {{ option.label }}
        @if (option.value === currentValue()) {
          <ng-icon name="lucideCheck" class="ml-auto" />
        }
      </app-command-option>
    </ng-template>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ComboboxComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  viewProviders: [provideIcons({ lucideChevronsUpDown, lucideCheck })],
  host: {
    '[class]': 'classes()',
    '(document:keydown.escape)': 'onDocumentKeyDown($event)',
    '(keydown.escape.prevent-with-stop)': 'onKeyDownEscape()',
    '(keydown.{arrowdown,arrowup,enter,home,end,pageup,pagedown,space}.prevent)':
      'onKeyDown($event)',
    '(keydown.tab)': 'onKeyDown($event)',
  },
  exportAs: 'combobox',
})
export class ComboboxComponent implements ControlValueAccessor {
  private readonly injector = inject(Injector);
  private readonly viewport = inject(ViewportService);

  protected readonly isMobile = this.viewport.isMobile;
  protected readonly sheetHeader = computed(() => this.label() || this.placeholder());

  readonly class = input<ClassValue>('');
  readonly buttonVariant = input<ButtonVariant>('outline');
  readonly width = input<ComboboxWidthVariants>('default');
  readonly placeholder = input<string>('Select...');
  readonly prefixIcon = input<string>('');
  readonly searchPlaceholder = input<string>('Search...');
  readonly emptyText = input<string>('No results found.');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly searchable = input(true, { transform: booleanAttribute });
  readonly value = input<string | null>(null);
  readonly options = input<ComboboxOption[]>([]);
  readonly groups = input<ComboboxGroup[]>([]);
  readonly ariaLabel = input<string>('');
  readonly ariaDescribedBy = input<string>('');

  readonly label = input<string>('');
  readonly hint = input<string>('');
  readonly required = input(false, { transform: booleanAttribute });
  readonly field = input<Field<unknown>>();

  readonly valueChange = output<string | null>();
  readonly comboSelected = output<ComboboxOption>();

  readonly popoverDirective = viewChild.required('popoverTrigger', { read: PopoverDirective });
  readonly buttonRef = viewChild.required('popoverTrigger', { read: ElementRef });
  readonly commandRef = viewChild('commandRef', { read: CommandComponent });
  readonly commandInputRef = viewChild('commandInputRef', { read: CommandInputComponent });

  protected readonly disabledState = linkedSignal(() => this.disabled());
  protected readonly internalValue = signal<string | null>(null);
  protected readonly open = signal(false);

  private readonly uniqueId = viewChild<IdDirective>('z');
  private readonly fieldState = fieldMessage(this.field);

  protected readonly showError = this.fieldState.showError;
  protected readonly errorMessage = this.fieldState.errorMessage;

  protected readonly baseId = computed(() => this.uniqueId()?.id() ?? 'combobox');
  protected readonly labelId = computed(() => `${this.baseId()}-label`);
  protected readonly messageId = computed(() => `${this.baseId()}-message`);
  protected readonly describedBy = computed(() => {
    const ids = [this.ariaDescribedBy(), this.errorMessage() || this.hint() ? this.messageId() : ''];
    return ids.filter(Boolean).join(' ') || null;
  });

  protected readonly labelClasses = fieldLabelClasses;
  protected readonly messageClasses = fieldMessageClasses;

  protected readonly classes = computed(() =>
    mergeClasses(
      'flex flex-col gap-1.5',
      comboboxVariants({
        width: this.width(),
      }),
      this.class(),
    ),
  );

  protected readonly buttonClasses = computed(() => 'w-full justify-between');

  protected readonly popoverClasses = computed(() => {
    if (this.isMobile()) {
      return `${MOBILE_SHEET_CONTENT_CLASSES} ${MOBILE_SHEET_ENTER_CLASSES} p-0`;
    }
    const widthClass =
      this.width() === 'full' ? 'w-full' : comboboxVariants({ width: this.width() });
    return `${widthClass} p-0`;
  });

  protected readonly currentValue = computed(() => this.value() ?? this.internalValue());

  protected readonly displayValue = computed(() => {
    const currentValue = this.currentValue();
    if (!currentValue) {
      return null;
    }

    // Search in groups first
    if (this.groups().length) {
      for (const group of this.groups()) {
        const option = group.options.find((opt) => opt.value === currentValue);
        if (option) {
          return option.label;
        }
      }
    }

    // Then search in flat options
    const option = this.options().find((opt) => opt.value === currentValue);
    return option?.label ?? null;
  });

  private onChange: (value: string | null) => void = () => {
    // ControlValueAccessor implementation
  };

  private onTouched: () => void = () => {
    // ControlValueAccessor implementation
  };

  setOpen(open: boolean) {
    this.open.set(open);
    if (open) {
      runInInjectionContext(this.injector, () =>
        afterNextRender(() => {
          const commandRef = this.commandRef();
          if (commandRef) {
            // Refresh options to ensure they're detected
            commandRef.refreshOptions();
            // Focus on search input if searchable, otherwise on command component
            if (this.searchable()) {
              this.commandInputRef()?.focus();
            } else {
              commandRef.focus();
            }
          }
        }),
      );
    }
  }

  handleSelect(commandOption: CommandOption) {
    const selectedValue = commandOption.value as string;

    // Toggle behavior - if same value is selected, clear it
    const newValue = selectedValue === this.currentValue() ? null : selectedValue;

    this.internalValue.set(newValue);
    this.onChange(newValue);
    this.valueChange.emit(newValue);

    // Emit the combobox option if we have a selection
    if (newValue) {
      let selectedOption: ComboboxOption | undefined;

      if (this.groups().length > 0) {
        for (const group of this.groups()) {
          selectedOption = group.options.find((opt) => opt.value === newValue);
          if (selectedOption) {
            break;
          }
        }
      } else {
        selectedOption = this.options().find((opt) => opt.value === newValue);
      }

      if (selectedOption) {
        this.comboSelected.emit(selectedOption);
      }
    }

    // Close the popover
    this.popoverDirective().hide();

    // Return focus to the combobox button after selection
    this.buttonRef().nativeElement.focus();
  }

  protected dismissFromHandle(): void {
    this.popoverDirective().hide(false);
    this.buttonRef().nativeElement.focus();
  }

  onKeyDownEscape(): void {
    if (this.open()) {
      this.popoverDirective().hide();
      this.buttonRef().nativeElement.focus();
    } else if (this.currentValue()) {
      this.internalValue.set(null);
      this.onChange(null);
      this.valueChange.emit(null);
    }
  }

  onKeyDown(e: Event) {
    if (this.disabledState()) {
      return;
    }

    const { key, ctrlKey, altKey, metaKey } = e as KeyboardEvent;

    // Handle different keyboard events based on combobox state
    if (this.open()) {
      // When popover is open
      switch (key) {
        case 'Tab':
          // Allow tab to close and move to next element
          this.popoverDirective().hide();
          break;
        case 'ArrowDown':
        case 'ArrowUp':
        case 'Enter':
        case 'Home':
        case 'End':
        case 'PageUp':
        case 'PageDown':
          // Forward navigation to command component
          this.commandRef()?.onKeyDown(e as KeyboardEvent);
          break;
      }
    } else {
      // When popover is closed
      switch (key) {
        case 'ArrowDown':
        case 'ArrowUp':
        case 'Enter':
        case ' ': // Space key
          this.popoverDirective().show();
          break;
        default:
          // For searchable comboboxes, open and start typing
          if (this.searchable() && key.length === 1 && !ctrlKey && !altKey && !metaKey) {
            this.popoverDirective().show();
            // Let the command input handle the character after opening
            runInInjectionContext(this.injector, () =>
              afterNextRender(() => {
                const inputElement = this.commandInputRef();
                if (inputElement) {
                  inputElement.searchInput().nativeElement.value = key;
                  inputElement.updateParentComponents(key);
                  inputElement.focus();
                }
              }),
            );
          }
          break;
      }
    }
  }

  // needed when component loses focus by keyboard.
  onDocumentKeyDown(event: Event) {
    // Close on Escape from anywhere when this combobox is open
    if (this.open()) {
      const target = event.target as Element;
      const buttonElement = this.buttonRef().nativeElement;
      // Only handle if not already handled by the component itself
      if (!buttonElement.contains(target)) {
        this.popoverDirective().hide();
        this.buttonRef().nativeElement.focus();
      }
    }
  }

  // ControlValueAccessor implementation
  writeValue(value: string | null): void {
    this.internalValue.set(value);
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabledState.set(isDisabled);
  }
}
