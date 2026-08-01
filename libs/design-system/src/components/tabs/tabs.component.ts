import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  type AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  DestroyRef,
  DOCUMENT,
  type ElementRef,
  inject,
  Injector,
  input,
  output,
  runInInjectionContext,
  signal,
  type TemplateRef,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';

import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideChevronDown,
  lucideChevronLeft,
  lucideChevronRight,
  lucideChevronUp,
} from '@ng-icons/lucide';
import clsx from 'clsx';
import { debounceTime, fromEvent, merge, map, distinctUntilChanged, filter } from 'rxjs';
import { twMerge } from 'tailwind-merge';

import { ButtonComponent } from '../button';
import {
  tabButtonVariants,
  tabContainerVariants,
  tabNavVariants,
  type TabVariants,
} from './tabs.variants';

export type position = 'top' | 'bottom' | 'left' | 'right';
export type align = 'center' | 'start' | 'end';

@Component({
  selector: 'app-tab',
  imports: [],
  template: `
    <ng-template #content>
      <ng-content />
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class TabComponent {
  readonly label = input.required<string>();
  readonly slug = input<string>('');
  readonly contentTemplate = viewChild.required<TemplateRef<unknown>>('content');
}

@Component({
  selector: 'app-tab-group',
  imports: [NgTemplateOutlet, ButtonComponent, NgIcon],
  template: `
    @if (showNav() && navBeforeContent()) {
      <ng-container [ngTemplateOutlet]="navigationBlock" />
    }

    <div class="flex-1">
      @for (tab of tabs(); track $index; let index = $index) {
        <div
          role="tabpanel"
          [attr.id]="'tabpanel-' + index"
          [attr.aria-labelledby]="'tab-' + index"
          [attr.tabindex]="0"
          [hidden]="activeTabIndex() !== index"
          class="focus-visible:ring-primary/50 outline-none focus-visible:ring-2"
        >
          <ng-container [ngTemplateOutlet]="tab.contentTemplate()" />
        </div>
      }
    </div>

    @if (showNav() && !navBeforeContent()) {
      <ng-container [ngTemplateOutlet]="navigationBlock" />
    }

    <ng-template #navigationBlock>
      @let horizontal = isHorizontal();

      <div [class]="navGridClasses()">
        @if (arrowsVisible()) {
          @if (horizontal) {
            <button
              type="button"
              [class]="'cursor-pointer pr-4 ' + (tabsPosition() === 'top' ? 'mb-4' : 'mt-4')"
              (click)="scrollNav('left')"
            >
              <ng-icon name="lucideChevronLeft" />
            </button>
          } @else {
            <button
              type="button"
              [class]="'cursor-pointer pb-4 ' + (tabsPosition() === 'left' ? 'mr-4' : 'ml-4')"
              (click)="scrollNav('up')"
            >
              <ng-icon name="lucideChevronUp" />
            </button>
          }
        }

        <nav
          [class]="navClasses()"
          #tabNav
          role="tablist"
          [attr.aria-orientation]="horizontal ? 'horizontal' : 'vertical'"
        >
          @for (tab of tabs(); track $index; let index = $index) {
            <button
              type="button"
              appButton
              variant="ghost"
              role="tab"
              [attr.id]="'tab-' + index"
              [attr.aria-selected]="activeTabIndex() === index"
              [attr.tabindex]="activeTabIndex() === index ? 0 : -1"
              [attr.aria-controls]="'tabpanel-' + index"
              (click)="setActiveTab(index)"
              [class]="buttonClassesSignal()[index]"
            >
              {{ tab.label() }}
            </button>
          }
        </nav>

        @if (arrowsVisible()) {
          @if (horizontal) {
            <button
              type="button"
              [class]="'cursor-pointer pl-4 ' + (tabsPosition() === 'top' ? 'mb-4' : 'mt-4')"
              (click)="scrollNav('right')"
            >
              <ng-icon name="lucideChevronRight" />
            </button>
          } @else {
            <button
              type="button"
              [class]="'cursor-pointer pt-4 ' + (tabsPosition() === 'left' ? 'mr-4' : 'ml-4')"
              (click)="scrollNav('down')"
            >
              <ng-icon name="lucideChevronDown" />
            </button>
          }
        }
      </div>
    </ng-template>
  `,
  styles: `
    .nav-tab-scroll {
      -webkit-overflow-scrolling: touch;
      scroll-behavior: smooth;
      &::-webkit-scrollbar-thumb {
        background-color: rgba(209, 209, 209, 0.2);
        border-radius: 2px;
      }
      &::-webkit-scrollbar {
        height: 4px;
        width: 4px;
      }
      &::-webkit-scrollbar-button {
        display: none;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  viewProviders: [
    provideIcons({
      lucideChevronLeft,
      lucideChevronUp,
      lucideChevronRight,
      lucideChevronDown,
    }),
  ],
  host: { '[class]': 'containerClasses()' },
})
export class TabGroupComponent implements AfterViewInit {
  private readonly tabComponents = contentChildren(TabComponent, { descendants: true });
  private readonly tabsContainer = viewChild<ElementRef>('tabNav');
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly window = inject(DOCUMENT).defaultView;

  protected readonly tabs = computed(() => this.tabComponents());
  protected readonly activeTabIndex = signal<number>(0);
  protected readonly scrollPresent = signal<boolean>(false);

  protected readonly tabChange = output<{
    index: number;
    label: string;
    tab: TabComponent;
  }>();

  protected readonly deselect = output<{
    index: number;
    label: string;
    tab: TabComponent;
  }>();

  readonly tabsPosition = input<TabVariants['position']>('top');
  readonly activePosition = input<TabVariants['activePosition']>('bottom');
  readonly showArrow = input(true);
  readonly scrollAmount = input(100);
  readonly alignTabs = input<align>('start');
  readonly showNav = input(true);
  readonly class = input<string>('');

  protected readonly arrowsVisible = computed(() => this.showArrow() && this.scrollPresent());

  ngAfterViewInit(): void {
    if (this.tabs().length) {
      this.setActiveTab(0);
    }

    runInInjectionContext(this.injector, () => {
      const observeInputs$ = merge(
        toObservable(this.showArrow),
        toObservable(this.tabs),
        toObservable(this.tabsPosition),
      );

      let observedEl: HTMLElement | null = null;
      const tabNavEl$ = toObservable(this.tabsContainer).pipe(
        filter((ref): ref is ElementRef => !!ref),
        map((ref) => ref.nativeElement as HTMLElement),
        distinctUntilChanged(),
      );

      afterNextRender(() => {
        if (!this.window || typeof ResizeObserver === 'undefined') {
          return;
        }

        const resizeObserver = new ResizeObserver(() => this.setScrollState());

        tabNavEl$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((el) => {
          if (observedEl) {
            resizeObserver.unobserve(observedEl);
          }
          observedEl = el;
          resizeObserver.observe(el);
          this.setScrollState();
        });

        merge(observeInputs$, fromEvent(this.window, 'resize'))
          .pipe(debounceTime(10), takeUntilDestroyed(this.destroyRef))
          .subscribe(() => this.setScrollState());

        this.destroyRef.onDestroy(() => resizeObserver.disconnect());
      });
    });
  }

  private setScrollState(): void {
    if (this.hasScroll() !== this.scrollPresent()) {
      this.scrollPresent.set(this.hasScroll());
    }
  }

  private hasScroll(): boolean {
    const navElement: HTMLElement | undefined = this.tabsContainer()?.nativeElement;
    if (navElement && this.showArrow()) {
      return (
        navElement.scrollWidth > navElement.clientWidth ||
        navElement.scrollHeight > navElement.clientHeight
      );
    }
    return false;
  }

  protected setActiveTab(index: number) {
    const currentTab = this.tabs()[this.activeTabIndex()];
    if (index !== this.activeTabIndex()) {
      this.deselect.emit({
        index: this.activeTabIndex(),
        label: currentTab.label(),
        tab: currentTab,
      });
    }

    this.activeTabIndex.set(index);
    const activeTabComponent = this.tabs()[index];
    if (activeTabComponent) {
      this.tabChange.emit({
        index,
        label: activeTabComponent.label(),
        tab: activeTabComponent,
      });
    }
  }

  protected readonly navBeforeContent = computed(() => {
    const position = this.tabsPosition();
    return position === 'top' || position === 'left';
  });

  protected readonly isHorizontal = computed(() => {
    const position = this.tabsPosition();
    return position === 'top' || position === 'bottom';
  });

  protected readonly navGridClasses = computed(() => {
    const gridLayout = this.isHorizontal()
      ? 'grid-cols-[25px_1fr_25px]'
      : 'grid-rows-[25px_1fr_25px]';
    if (this.arrowsVisible()) {
      return twMerge(clsx('grid', gridLayout));
    }
    return 'grid';
  });

  protected readonly containerClasses = computed(() =>
    twMerge(tabContainerVariants({ position: this.tabsPosition() }), this.class()),
  );

  protected readonly navClasses = computed(() =>
    tabNavVariants({
      position: this.tabsPosition(),
      alignTabs: this.arrowsVisible() ? 'start' : this.alignTabs(),
    }),
  );

  protected readonly buttonClassesSignal = computed(() => {
    const activeIndex = this.activeTabIndex();
    const position = this.activePosition();
    return this.tabs().map((_, index) => {
      const isActive = activeIndex === index;
      return tabButtonVariants({ activePosition: position, isActive });
    });
  });

  protected scrollNav(direction: 'left' | 'right' | 'up' | 'down') {
    const container = this.tabsContainer()?.nativeElement;
    if (!container) {
      return;
    }
    const scrollAmount = this.scrollAmount();
    if (direction === 'left') {
      container.scrollLeft -= scrollAmount;
    } else if (direction === 'right') {
      container.scrollLeft += scrollAmount;
    } else if (direction === 'up') {
      container.scrollTop -= scrollAmount;
    } else if (direction === 'down') {
      container.scrollTop += scrollAmount;
    }
  }

  selectTabByIndex(index: number): void {
    if (index >= 0 && index < this.tabs().length) {
      this.setActiveTab(index);
    } else {
      console.warn(`Index ${index} outside the range of available tabs.`);
    }
  }

  readonly tabItems = computed(() =>
    this.tabs().map((tab, index) => ({ slug: tab.slug() || `tab-${index}`, label: tab.label() })),
  );

  readonly activeSlug = computed<string | null>(
    () => this.tabItems()[this.activeTabIndex()]?.slug ?? null,
  );

  selectBySlug(slug: string): void {
    const index = this.tabItems().findIndex((tab) => tab.slug === slug);
    if (index !== -1) {
      this.setActiveTab(index);
    }
  }
}
