import {
  Overlay,
  OverlayModule,
  OverlayPositionBuilder,
  type OverlayRef,
} from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  model,
  type OnDestroy,
  output,
  PLATFORM_ID,
  runInInjectionContext,
  signal,
  type TemplateRef,
  viewChild,
  ViewContainerRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { Field, FormValueControl } from '@angular/forms/signals';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronDown } from '@ng-icons/lucide';
import type { ClassValue } from 'clsx';
import { filter } from 'rxjs';

import { BadgeComponent } from '../badge';
import { SelectItemComponent } from './select-item.component';
import {
  selectContentVariants,
  selectTriggerVariants,
  selectVariants,
  type SelectSizeVariants,
} from './select.variants';
import { IdDirective } from '../../core';
import { MOBILE_SHEET_CONTENT_CLASSES, ViewportService } from '../../core/services/viewport.service';
import { fieldLabelClasses, fieldMessage, fieldMessageClasses } from '../../utils/field-message';
import { mergeClasses } from '../../utils/merge-classes';

type SelectValue = string | string[] | null;

const COMPACT_MODE_WIDTH_THRESHOLD = 100;

@Component({
  selector: 'app-select, [app-select]',
  imports: [OverlayModule, BadgeComponent, NgIcon, IdDirective],
  template: `
    @if (label()) {
      <label [id]="labelId()" [attr.for]="triggerId()" [class]="labelClasses()">
        {{ label() }}
        @if (required()) {
          <span class="text-destructive" aria-hidden="true">*</span>
        }
      </label>
    }

    <ng-container appId="select" #z="appId" />

    <div
      [class]="controlClasses()"
      [attr.data-active]="isFocus() ? '' : null"
      [attr.data-disabled]="disabledState() ? '' : null"
      data-slot="select-control"
      #control
    >
      <button
        type="button"
        role="combobox"
        aria-controls="dropdown"
        [id]="triggerId()"
        [class]="triggerClasses()"
        [disabled]="disabledState()"
        [attr.aria-expanded]="isOpen()"
        [attr.aria-haspopup]="'listbox'"
        [attr.aria-labelledby]="label() ? labelId() : null"
        [attr.aria-describedby]="describedBy()"
        [attr.aria-required]="required() || null"
        [attr.aria-invalid]="showError() || null"
        [attr.data-placeholder]="!value() ? '' : null"
        (blur)="!isOpen() && isFocus.set(false)"
        (click)="toggle()"
        (focus)="onFocus()"
      >
        <span class="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          @for (selectedLabel of selectedLabels(); track $index) {
            @if (multiple()) {
              <app-badge type="secondary">
                <span class="truncate">{{ selectedLabel }}</span>
              </app-badge>
            } @else {
              <span class="truncate">{{ selectedLabel }}</span>
            }
          } @empty {
            <span class="text-muted-foreground truncate">{{ placeholder() }}</span>
          }
        </span>
        <ng-icon name="lucideChevronDown" class="size-4! opacity-50" />
      </button>
    </div>

    @let message = errorMessage();
    @if (message) {
      <p [id]="messageId()" [class]="messageClasses(true)" role="alert" aria-live="polite">
        {{ message }}
      </p>
    } @else if (hint()) {
      <p [id]="messageId()" [class]="messageClasses(false)">{{ hint() }}</p>
    }

    <ng-template #dropdownTemplate>
      <div
        id="dropdown"
        [class]="contentClasses()"
        role="listbox"
        [attr.data-state]="'open'"
        (keydown.{arrowdown,arrowup,enter,space,escape,home,end}.prevent)="
          onDropdownKeydown($event)
        "
        tabindex="-1"
      >
        <div class="p-1">
          <ng-content />
        </div>
      </div>
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [provideIcons({ lucideChevronDown })],
  host: {
    '[attr.data-active]': 'isFocus() ? "" : null',
    '[attr.data-disabled]': 'disabledState() ? "" : null',
    '[attr.data-state]': 'isOpen() ? "open" : "closed"',
    '[class]': 'classes()',
    '(keydown.{enter,space,arrowdown,arrowup,escape}.prevent)': 'onTriggerKeydown($event)',
  },
})
export class SelectComponent implements FormValueControl<SelectValue>, OnDestroy {
  private readonly destroyRef = inject(DestroyRef);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly injector = inject(Injector);
  private readonly overlay = inject(Overlay);
  private readonly overlayPositionBuilder = inject(OverlayPositionBuilder);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly viewport = inject(ViewportService);

  protected readonly isMobile = this.viewport.isMobile;

  readonly dropdownTemplate = viewChild.required<TemplateRef<void>>('dropdownTemplate');
  readonly selectItems = contentChildren(SelectItemComponent);

  private overlayRef?: OverlayRef;
  private portal?: TemplatePortal;
  private overlayIsMobile = false;

  readonly class = input<ClassValue>('');
  readonly maxLabelCount = input<number>(1);
  readonly multiple = input<boolean>(false);
  readonly placeholder = input<string>('Select an option...');
  readonly size = input<SelectSizeVariants>('default');
  readonly displayLabel = input<string>('');

  readonly label = input<string>('');
  readonly hint = input<string>('');
  readonly required = input(false, { transform: booleanAttribute });
  readonly field = input<Field<unknown>>();

  // Signal Forms contract (`FormValueControl`): `value` is the two-way model and `disabled`
  // is an `input()` that `[formField]` writes into.
  readonly value = model<SelectValue>(this.multiple() ? [] : '');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly touch = output<void>();

  readonly selectionChange = output<string | string[]>();

  readonly isOpen = signal(false);
  readonly focusedIndex = signal<number>(-1);
  protected readonly isFocus = signal(false);
  protected readonly isCompact = signal(false);
  protected readonly disabledState = computed(() => this.disabled());

  constructor() {
    effect(() => {
      if (this.disabledState() && this.isOpen()) {
        this.close(false);
      }
    });

    effect(() => this.updateItems(this.selectItems()));
  }

  protected onFocus(): void {
    if (this.isCompact()) {
      this.isFocus.set(true);
    }
  }

  // Compute the label based on selected value
  readonly selectedLabels = computed<string[]>(() => {
    const selectedValue = this.value();
    if (this.multiple() && Array.isArray(selectedValue)) {
      return this.provideLabelsForMultiselectMode(selectedValue);
    }

    return this.provideLabelForSingleSelectMode(selectedValue as string);
  });

  private readonly uniqueId = viewChild<IdDirective>('z');
  private readonly control = viewChild<ElementRef<HTMLElement>>('control');

  /**
   * Ancre et référence de largeur du dropdown. L'hôte porte désormais le
   * libellé et le message, s'y ancrer ouvrirait la liste sous le hint.
   */
  private controlElement(): ElementRef<HTMLElement> {
    return this.control() ?? this.elementRef;
  }
  private readonly fieldState = fieldMessage(this.field);

  protected readonly showError = this.fieldState.showError;
  protected readonly errorMessage = this.fieldState.errorMessage;

  protected readonly baseId = computed(() => this.uniqueId()?.id() ?? 'select');
  protected readonly labelId = computed(() => `${this.baseId()}-label`);
  protected readonly messageId = computed(() => `${this.baseId()}-message`);
  protected readonly triggerId = computed(() => `${this.baseId()}-trigger`);
  protected readonly describedBy = computed(() =>
    this.errorMessage() || this.hint() ? this.messageId() : null,
  );

  protected readonly labelClasses = fieldLabelClasses;
  protected readonly messageClasses = fieldMessageClasses;

  protected readonly classes = computed(() =>
    mergeClasses('flex w-full flex-col gap-1.5', this.class()),
  );
  protected readonly controlClasses = computed(() =>
    mergeClasses(
      selectVariants(),
      this.showError() ? 'border-destructive data-active:border-destructive' : '',
    ),
  );
  protected readonly contentClasses = computed(() =>
    mergeClasses(selectContentVariants(), this.isMobile() ? MOBILE_SHEET_CONTENT_CLASSES : ''),
  );
  protected readonly triggerClasses = computed(() =>
    mergeClasses(
      selectTriggerVariants({
        size: this.size(),
      }),
    ),
  );

  ngOnDestroy() {
    this.destroyOverlay();
  }

  onTriggerKeydown(event: Event) {
    if (this.disabledState()) {
      return;
    }

    const { key } = event as KeyboardEvent;
    switch (key) {
      case 'Enter':
      case ' ':
      case 'ArrowDown':
      case 'ArrowUp':
        if (!this.isOpen()) {
          this.open();
        }
        break;
      case 'Escape':
        if (this.isOpen()) {
          this.close();
        }
        break;
    }
  }

  onDropdownKeydown(e: Event) {
    const { key } = e as KeyboardEvent;
    const items = this.getSelectItems();

    switch (key) {
      case 'ArrowDown':
        this.navigateItems(1, items);
        break;
      case 'ArrowUp':
        this.navigateItems(-1, items);
        break;
      case 'Enter':
      case ' ':
        this.selectFocusedItem(items);
        break;
      case 'Escape':
        this.close();
        this.focusButton();
        break;
      case 'Home':
        this.focusFirstItem(items);
        break;
      case 'End':
        this.focusLastItem(items);
        break;
    }
  }

  toggle() {
    if (this.disabledState()) {
      return;
    }

    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  selectItem(value: string, label: string) {
    if (this.disabledState()) {
      return;
    }

    if (value === undefined || value === null || value === '') {
      console.warn('Attempted to select item with invalid value:', { value, label });
      return;
    }

    this.value.update((selectedValues) => {
      if (Array.isArray(selectedValues)) {
        return selectedValues.includes(value)
          ? selectedValues.filter((v) => v !== value)
          : [...selectedValues, value];
      }

      return value;
    });
    this.touch.emit();
    this.selectionChange.emit(this.value() ?? '');

    if (this.multiple()) {
      // in multiple mode it can happen that button changes size because of selection badges,
      // which requires overlay position to update
      this.updateOverlayPosition();
    } else {
      this.close();

      // Return focus to the button after selection
      setTimeout(() => {
        this.focusButton();
      }, 0);
    }
  }

  private updateItems(items: readonly SelectItemComponent[]): void {
    const hostWidth = this.controlElement().nativeElement.offsetWidth || 0;
    const isCompact = hostWidth <= COMPACT_MODE_WIDTH_THRESHOLD;
    this.isCompact.set(isCompact);
    // Setup select host reference for each item
    for (const [index, item] of items.entries()) {
      item.setSelectHost({
        selectedValue: () =>
          this.multiple() ? (this.value() as string[]) : [this.value() as string],
        selectItem: (value: string, label: string) => this.selectItem(value, label),
        navigateTo: () => this.navigateTo(item, index),
      });
      item.size.set(this.size());
      item.mode.set(isCompact ? 'compact' : 'normal');
    }
  }

  private navigateTo(element: SelectItemComponent, index: number): void {
    this.focusedIndex.set(index);
    this.updateItemFocus(this.getSelectItems(true), index);
  }

  private updateOverlayPosition(): void {
    setTimeout(() => {
      this.overlayRef?.updatePosition();
    }, 0);
  }

  private provideLabelsForMultiselectMode(selectedValue: string[]): string[] {
    const labelsToShowCount = selectedValue.length - this.maxLabelCount();
    const labels = [];
    let index = 0;
    for (const value of selectedValue) {
      const matchingItem = this.getMatchingItem(value);
      if (matchingItem) {
        labels.push(matchingItem.label());
        index++;
      }
      if (labelsToShowCount && this.maxLabelCount() && index === this.maxLabelCount()) {
        labels.push(`${labelsToShowCount} more item${labelsToShowCount > 1 ? 's' : ''} selected`);
        break;
      }
    }
    return labels;
  }

  private provideLabelForSingleSelectMode(selectedValue: string): string[] {
    const manualLabel = this.displayLabel();
    if (manualLabel) {
      return [manualLabel];
    }

    const matchingItem = this.getMatchingItem(selectedValue);
    if (matchingItem) {
      return [matchingItem.label()];
    }

    return selectedValue ? [selectedValue] : [];
  }

  private open() {
    if (this.isOpen() || this.disabledState()) {
      return;
    }

    const mobile = this.isMobile();

    // Recreate the overlay if the presentation mode changed (viewport resize).
    if (this.overlayRef && this.overlayIsMobile !== mobile) {
      this.destroyOverlay();
    }

    if (!this.overlayRef) {
      this.createOverlay(mobile);
    }

    if (!this.overlayRef) {
      return;
    }

    if (this.overlayRef.hasAttached()) {
      this.overlayRef.detach();
    }

    this.portal = new TemplatePortal(this.dropdownTemplate(), this.viewContainerRef);
    this.overlayRef.attach(this.portal);
    this.isOpen.set(true);
    this.updateFocusWhenNormalMode();

    if (mobile) {
      this.setFocusOnOpen();
      return;
    }

    const hostWidth = this.controlElement().nativeElement.offsetWidth || 0;
    this.overlayRef.updateSize({ width: hostWidth });
    this.determinePortalWidthOnOpen(hostWidth);
  }

  private setFocusOnOpen(): void {
    this.focusDropdown();
    this.focusSelectedItem();
  }

  private close(shouldTouch = true) {
    if (this.overlayRef?.hasAttached()) {
      this.overlayRef.detach();
    }
    this.isOpen.set(false);
    this.focusedIndex.set(-1);
    if (shouldTouch) {
      this.touch.emit();
    }
    this.updateFocusWhenNormalMode();
  }

  private updateFocusWhenNormalMode(): void {
    if (!this.isCompact()) {
      this.isFocus.set(!this.isOpen());
    }
  }

  private getMatchingItem(value: string): SelectItemComponent | undefined {
    return this.selectItems()?.find((item) => item.value() === value);
  }

  private determinePortalWidthOnOpen(portalWidth: number): void {
    runInInjectionContext(this.injector, () => {
      afterNextRender(() => {
        if (!this.overlayRef || !this.overlayRef.hasAttached()) {
          return;
        }

        const overlayPaneElement = this.overlayRef.overlayElement;
        const textElements = Array.from(
          overlayPaneElement.querySelectorAll<HTMLElement>(
            'app-select-item > span.truncate, [app-select-item] > span.truncate',
          ),
        );
        let isOverflow = false;
        for (const textElement of textElements) {
          if (textElement.scrollWidth > textElement.clientWidth + 1) {
            isOverflow = true;
            break;
          }
        }

        if (!isOverflow) {
          this.setFocusOnOpen();
          return;
        }

        const selectItems = this.selectItems();
        let itemMaxWidth = 0;
        for (const item of selectItems) {
          itemMaxWidth = Math.max(itemMaxWidth, item.elementRef.nativeElement.scrollWidth);
        }

        const [selectItem] = selectItems;
        if (isOverflow && selectItem) {
          const elementStyles = getComputedStyle(selectItem.elementRef.nativeElement);
          const leftPadding =
            Number.parseFloat(elementStyles.getPropertyValue('padding-left')) || 0;
          const rightPadding =
            Number.parseFloat(elementStyles.getPropertyValue('padding-right')) || 0;
          itemMaxWidth += leftPadding + rightPadding;
        }

        itemMaxWidth = Math.max(itemMaxWidth, portalWidth);
        this.overlayRef.updateSize({ width: itemMaxWidth });
        this.overlayRef.updatePosition();

        this.setFocusOnOpen();
      });
    });
  }

  private createOverlay(mobile = false) {
    if (this.overlayRef) {
      return;
    } // Already created

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      this.overlayIsMobile = mobile;
      this.overlayRef = mobile ? this.createSheetOverlay() : this.createPopoverOverlay();

      if (mobile) {
        this.overlayRef
          .backdropClick()
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => {
            this.isFocus.set(false);
            this.close();
          });
      }

      this.overlayRef
        .outsidePointerEvents()
        .pipe(
          filter((event) => !this.elementRef.nativeElement.contains(event.target)),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe(() => {
          this.isFocus.set(false);
          this.close();
        });
    } catch (error) {
      console.error('Error creating overlay:', error);
    }
  }

  private createPopoverOverlay(): OverlayRef {
    const positionStrategy = this.overlayPositionBuilder
      .flexibleConnectedTo(this.controlElement())
      .withPositions([
        { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top', offsetY: 4 },
        { originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom', offsetY: -4 },
      ])
      .withPush(false);

    const elementWidth = this.elementRef.nativeElement.offsetWidth || 200;

    return this.overlay.create({
      positionStrategy,
      hasBackdrop: false,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      width: elementWidth,
      maxHeight: 384, // max-h-96 equivalent
    });
  }

  private createSheetOverlay(): OverlayRef {
    return this.overlay.create({
      positionStrategy: this.overlay.position().global(),
      hasBackdrop: true,
      scrollStrategy: this.overlay.scrollStrategies.block(),
    });
  }

  private destroyOverlay() {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = undefined;
    }
  }

  private getSelectItems(ignoreFilter = false): HTMLElement[] {
    if (!this.overlayRef?.hasAttached()) {
      return [];
    }
    const dropdownElement = this.overlayRef.overlayElement;
    return Array.from(
      dropdownElement.querySelectorAll<HTMLElement>('app-select-item, [app-select-item]'),
    ).filter((item) => ignoreFilter || item.dataset['disabled'] === undefined);
  }

  private navigateItems(direction: number, items: HTMLElement[]) {
    if (items.length === 0) {
      return;
    }

    const currentIndex = this.focusedIndex();
    let nextIndex = currentIndex + direction;

    if (nextIndex < 0) {
      nextIndex = items.length - 1;
    } else if (nextIndex >= items.length) {
      nextIndex = 0;
    }

    this.focusedIndex.set(nextIndex);
    this.updateItemFocus(items, nextIndex);
  }

  private selectFocusedItem(items: HTMLElement[]) {
    const currentIndex = this.focusedIndex();
    if (currentIndex >= 0 && currentIndex < items.length) {
      const item = items[currentIndex];
      const value = item.getAttribute('value');
      const label = item.textContent?.trim() ?? '';

      if (value === null || value === undefined) {
        console.warn('No value attribute found on selected item:', item);
        return;
      }

      this.selectItem(value, label);
    }
  }

  private focusFirstItem(items: HTMLElement[]) {
    if (items.length > 0) {
      this.focusedIndex.set(0);
      this.updateItemFocus(items, 0);
    }
  }

  private focusLastItem(items: HTMLElement[]) {
    if (items.length > 0) {
      const lastIndex = items.length - 1;
      this.focusedIndex.set(lastIndex);
      this.updateItemFocus(items, lastIndex);
    }
  }

  private updateItemFocus(items: HTMLElement[], focusedIndex: number) {
    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      if (index === focusedIndex) {
        item.focus();
        item.setAttribute('aria-selected', 'true');
        item.setAttribute('data-selected', 'true');
      } else {
        item.removeAttribute('aria-selected');
        item.removeAttribute('data-selected');
      }
    }
  }

  private focusDropdown() {
    if (this.overlayRef?.hasAttached()) {
      const dropdownElement = this.overlayRef.overlayElement.querySelector(
        '[role="listbox"]',
      ) as HTMLElement;
      if (dropdownElement) {
        dropdownElement.focus();
      }
    }
  }

  private focusButton() {
    const button = this.elementRef.nativeElement.querySelector('button');
    if (button) {
      button.focus();
    }
  }

  private focusSelectedItem() {
    const items = this.getSelectItems();
    if (items.length === 0) {
      return;
    }

    // Find the index of the currently selected item
    const currentValue = this.value();
    let selectedValue;
    if (Array.isArray(currentValue) && currentValue.length) {
      [selectedValue] = currentValue;
    } else {
      selectedValue = currentValue;
    }

    let selectedIndex = items.findIndex((item) => item.getAttribute('value') === selectedValue);

    // If no item is selected, focus the first item
    if (selectedIndex === -1) {
      selectedIndex = 0;
    }

    this.focusedIndex.set(selectedIndex);
    this.updateItemFocus(items, selectedIndex);
  }
}
