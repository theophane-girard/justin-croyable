import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
  ViewEncapsulation,
  type TemplateRef,
} from '@angular/core';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronLeft, lucideChevronRight } from '@ng-icons/lucide';
import type { ClassValue } from 'clsx';
import { filter } from 'rxjs';

import {
  sidebarGroupLabelVariants,
  sidebarGroupVariants,
  sidebarTriggerVariants,
  sidebarVariants,
} from './layout.variants';
import { StringTemplateOutletDirective } from '../../core/directives/string-template-outlet/string-template-outlet.directive';
import { SidebarService } from '../../core/services/sidebar.service';
import { mergeClasses } from '../../utils/merge-classes';

@Component({
  selector: 'app-sidebar',
  imports: [StringTemplateOutletDirective, NgIcon],
  template: `
    <div [class]="backdropClasses()" aria-hidden="true" (click)="closeMobile()"></div>

    <aside [class]="classes()" [style.width.px]="currentWidth()" [attr.data-collapsed]="collapsed()">
      <div class="flex-1 overflow-auto">
        <ng-content />
      </div>

      @if (collapsible() && !trigger()) {
        <div
          [class]="triggerClasses()"
          (click)="toggleCollapsed()"
          (keydown.{enter,space}.prevent)="toggleCollapsed()"
          tabindex="0"
          role="button"
          [attr.aria-label]="collapsed() ? 'Expand sidebar' : 'Collapse sidebar'"
          [attr.aria-expanded]="!collapsed()"
        >
          <ng-icon [name]="chevronIcon()" class="pointer-events-none size-4! shrink-0" />
        </div>
      }

      @if (collapsible() && trigger()) {
        <ng-container *appStringTemplateOutlet="trigger()" />
      }
    </aside>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  viewProviders: [provideIcons({ lucideChevronRight, lucideChevronLeft })],
  exportAs: 'sidebar',
})
export class SidebarComponent {
  readonly width = input<string | number>(200);
  readonly collapsedWidth = input<number>(64);
  readonly collapsible = input(false, { transform: booleanAttribute });
  readonly collapsed = input(false, { transform: booleanAttribute });
  readonly reverseArrow = input(false, { transform: booleanAttribute });
  readonly trigger = input<TemplateRef<void> | null>(null);
  readonly class = input<ClassValue>('');

  readonly collapsedChange = output<boolean>();

  private readonly internalCollapsed = signal(false);
  private readonly sidebarService = inject(SidebarService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  protected readonly mobileOpen = this.sidebarService.mobileOpen;

  constructor() {
    this.sidebarService.registerSidebar();
    this.destroyRef.onDestroy(() => this.sidebarService.unregisterSidebar());

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.sidebarService.closeMobile());

    effect(() => {
      this.internalCollapsed.set(this.collapsed());
    });
  }

  protected closeMobile(): void {
    this.sidebarService.closeMobile();
  }

  protected readonly currentWidth = computed(() => {
    const collapsed = this.collapsed();
    if (collapsed) {
      return this.collapsedWidth();
    }

    const width = this.width();
    return typeof width === 'number' ? width : parseInt(width, 10);
  });

  protected readonly chevronIcon = computed((): string => {
    const collapsed = this.collapsed();
    const reverse = this.reverseArrow();
    const icons = ['lucideChevronLeft', 'lucideChevronRight'];

    if (reverse) {
      return collapsed ? icons[0] : icons[1];
    }
    return collapsed ? icons[1] : icons[0];
  });

  protected readonly mobileClasses = computed(() =>
    mergeClasses(
      'max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-50 max-md:w-72! max-md:shadow-xl',
      this.mobileOpen() ? 'max-md:translate-x-0' : 'max-md:-translate-x-full',
    ),
  );

  protected readonly backdropClasses = computed(() =>
    mergeClasses(
      'fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ease-in-out md:hidden',
      this.mobileOpen() ? 'opacity-100' : 'pointer-events-none opacity-0',
    ),
  );

  protected readonly classes = computed(() =>
    mergeClasses(sidebarVariants(), this.mobileClasses(), this.class()),
  );

  protected readonly triggerClasses = computed(() =>
    mergeClasses(sidebarTriggerVariants(), 'max-md:hidden'),
  );

  toggleCollapsed(): void {
    const newState = !this.collapsed();
    this.internalCollapsed.set(newState);
    this.collapsedChange.emit(newState);
  }
}

@Component({
  selector: 'app-sidebar-group',
  template: `
    <div [class]="classes()">
      <ng-content />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'sidebarGroup',
})
export class SidebarGroupComponent {
  readonly class = input<ClassValue>('');

  protected readonly classes = computed(() => mergeClasses(sidebarGroupVariants(), this.class()));
}

@Component({
  selector: 'app-sidebar-group-label',
  template: `
    <div [class]="classes()">
      <ng-content />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'sidebarGroupLabel',
})
export class SidebarGroupLabelComponent {
  readonly class = input<ClassValue>('');

  protected readonly classes = computed(() => mergeClasses(sidebarGroupLabelVariants(), this.class()));
}
