import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck } from '@ng-icons/lucide';

import {
  selectItemIconVariants,
  selectItemVariants,
  type SelectItemModeVariants,
  type SelectSizeVariants,
} from './select.variants';
import { mergeClasses, noopFn } from '../../utils/merge-classes';

// Interface to avoid circular dependency
interface SelectHost {
  selectedValue(): string[];
  selectItem(value: string, label: string): void;
  navigateTo(): void;
}

@Component({
  selector: 'app-select-item, [app-select-item]',
  imports: [NgIcon],
  template: `
    @if (isSelected()) {
      <span [class]="iconClasses()">
        <ng-icon name="lucideCheck" [strokeWidth]="strokeWidth()" aria-hidden="true" data-testid="check-icon" />
      </span>
    }
    <span class="flex min-w-0 flex-col">
      <span #labelText class="truncate">
        <ng-content />
      </span>
      @if (hint()) {
        <span class="text-muted-foreground truncate text-xs">{{ hint() }}</span>
      }
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [provideIcons({ lucideCheck })],
  host: {
    role: 'option',
    tabindex: '-1',
    '[class]': 'classes()',
    '[hidden]': 'isHidden()',
    '[attr.value]': 'value()',
    '[attr.data-disabled]': 'disabled() ? "" : null',
    '[attr.data-selected]': 'isSelected() ? "" : null',
    '[attr.aria-selected]': 'isSelected()',
    '(click)': 'onClick()',
    '(mouseenter)': 'onMouseEnter()',
    '(keydown.{tab}.prevent)': 'noopFn',
  },
})
export class SelectItemComponent {
  readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly value = input.required<string>();
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly class = input<string>('');
  readonly searchKeywords = input<string>('');
  readonly hint = input<string>('');
  readonly providedLabel = input<string>('', { alias: 'label' });

  private readonly select = signal<SelectHost | null>(null);
  private readonly labelText = viewChild<ElementRef<HTMLElement>>('labelText');
  noopFn = noopFn;

  readonly label = computed<string>(() => {
    const provided = this.providedLabel().trim();
    if (provided) {
      return provided;
    }
    const element = this.labelText()?.nativeElement ?? this.elementRef.nativeElement;
    return (element.textContent ?? element.innerText)?.trim() ?? '';
  });

  readonly mode = signal<SelectItemModeVariants>('normal');
  readonly size = signal<SelectSizeVariants>('default');
  readonly isHidden = signal(false);

  protected readonly classes = computed(() =>
    mergeClasses(selectItemVariants({ mode: this.mode(), size: this.size() }), this.class()),
  );

  protected readonly iconClasses = computed(() =>
    mergeClasses(selectItemIconVariants({ mode: this.mode(), size: this.size() })),
  );

  protected readonly strokeWidth = computed(() => (this.mode() === 'compact' ? 3 : 2));

  protected readonly isSelected = computed(() => this.select()?.selectedValue().includes(this.value()) ?? false);

  setSelectHost(selectHost: SelectHost) {
    this.select.set(selectHost);
  }

  matchesSearch(searchTerm: string): boolean {
    if (!searchTerm) {
      return true;
    }
    if (this.label().toLowerCase().includes(searchTerm)) {
      return true;
    }
    return this.searchKeywords().toLowerCase().includes(searchTerm);
  }

  onMouseEnter() {
    if (this.disabled()) {
      return;
    }
    this.select()?.navigateTo();
  }

  onClick() {
    if (this.disabled()) {
      return;
    }
    this.select()?.selectItem(this.value(), this.label());
  }
}
