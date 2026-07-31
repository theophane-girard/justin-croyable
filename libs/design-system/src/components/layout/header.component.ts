import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  ViewEncapsulation,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import type { ClassValue } from 'clsx';

import { headerVariants } from './layout.variants';
import { mergeClasses } from '../../utils/merge-classes';

export type TabItem = {
  slug: string;
  label: string;
  /**
   * When set, the tab renders as a `routerLink` with `routerLinkActive`.
   * When omitted, the tab renders as a button that emits `tabClicked` and
   * reflects the `activeSlug` input for its active state.
   */
  link?: string | string[];
};

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header [class]="classes()">
      <div
        class="flex w-full items-center"
        [style.min-height.px]="tabs().length ? null : height()"
        [class.pt-3]="tabs().length"
        [class.pb-1]="tabs().length"
      >
        <ng-content />
      </div>

      @if (tabs().length) {
        <nav class="flex items-center gap-4 border-b border-border" aria-label="Onglets">
          @for (tab of tabs(); track tab.slug) {
            @if (tab.link) {
              <a
                [routerLink]="tab.link"
                routerLinkActive
                #rla="routerLinkActive"
                ariaCurrentWhenActive="page"
                [class]="tabClass(rla.isActive)"
              >
                {{ tab.label }}
              </a>
            } @else {
              <button
                type="button"
                [attr.aria-current]="tab.slug === activeSlug() ? 'page' : null"
                (click)="tabClicked.emit(tab.slug)"
                [class]="tabClass(tab.slug === activeSlug())"
              >
                {{ tab.label }}
              </button>
            }
          }
        </nav>
      }
    </header>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  // The host carries no box of its own; the inner <header> is the layout
  // element so consumer classes (passed via `class`) and sticky positioning
  // apply to a real flow child of the scroll container, not an inline wrapper.
  host: { class: 'contents' },
  exportAs: 'header',
})
export class HeaderComponent {
  readonly class = input<ClassValue>('');
  readonly height = input<number>(64);
  readonly tabs = input<TabItem[]>([]);
  /** Active tab slug — drives the active state of link-less (button) tabs. */
  readonly activeSlug = input<string | null>(null);

  readonly tabClicked = output<string>();

  protected readonly classes = computed(() =>
    mergeClasses(
      headerVariants(),
      // The tabs row carries the single bottom border; drop the header's own
      // so it doesn't double up with the tabs (or a tab-group below it).
      this.tabs().length ? 'border-b-0' : '',
      this.class(),
    ),
  );

  protected tabClass(active: boolean): string {
    return mergeClasses(
      '-mb-px inline-flex cursor-pointer items-center border-b-2 bg-transparent px-1 pt-1 pb-2 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-none',
      active
        ? 'border-primary text-foreground'
        : 'border-transparent text-muted-foreground hover:text-foreground',
    );
  }
}
