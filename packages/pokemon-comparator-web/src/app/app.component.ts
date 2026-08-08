import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterLink,
  RouterOutlet,
} from '@angular/router';
import { filter, map } from 'rxjs';

import {
  LayoutImports,
  SegmentComponent,
  type SegmentItem,
  SkeletonComponent,
  ThemeService,
} from '@justin-croyable/design-system';
import { NgIcon } from '@ng-icons/core';

import { APP_PATHS } from './app.routes';

const THEME_VALUE = { light: 'light', dark: 'dark' } as const;

const THEME_ITEMS: readonly SegmentItem[] = [
  { value: THEME_VALUE.light, icon: 'phosphorSun', ariaLabel: 'Thème clair' },
  { value: THEME_VALUE.dark, icon: 'phosphorMoon', ariaLabel: 'Thème sombre' },
];

interface NavItem {
  readonly path: string;
  readonly link: string;
  readonly label: string;
  readonly icon: string;
}

const NAV_ITEMS: readonly NavItem[] = [
  { path: APP_PATHS.comparator, link: '/', label: 'Comparateur', icon: 'phosphorScales' },
  {
    path: APP_PATHS.pokedex,
    link: `/${APP_PATHS.pokedex}`,
    label: 'Pokédex',
    icon: 'phosphorSquaresFour',
  },
];

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, ...LayoutImports, NgIcon, SegmentComponent, SkeletonComponent],
  template: `
    <div class="bg-background text-foreground h-dvh overflow-hidden">
      <app-layout direction="horizontal" class="h-full">
        <app-sidebar
          [width]="220"
          [collapsible]="true"
          [collapsed]="sidebarCollapsed()"
          (collapsedChange)="sidebarCollapsed.set($event)"
        >
          <div class="flex h-full flex-col">
            <app-sidebar-group class="px-1 py-3">
              <div
                class="mb-2 flex items-center gap-2 px-2"
                [class.justify-center]="sidebarCollapsed()"
              >
                <ng-icon name="phosphorScales" class="text-primary size-6 shrink-0" />
                <span class="text-base font-semibold" [class.hidden]="sidebarCollapsed()">
                  Pokémon Comparator
                </span>
              </div>
              <app-sidebar-group-label [class.hidden]="sidebarCollapsed()">
                Navigation
              </app-sidebar-group-label>
              @for (item of navLinks(); track item.path) {
                <a
                  appSidebarItem
                  [routerLink]="item.link"
                  [icon]="item.icon"
                  [label]="item.label"
                  [active]="item.active"
                  [collapsed]="sidebarCollapsed()"
                ></a>
              }
            </app-sidebar-group>

            <app-sidebar-group class="mt-auto px-1 py-3">
              <app-segment
                variant="accent"
                size="sm"
                class="w-full"
                [items]="themeItems"
                [value]="theme.theme()"
                (valueChange)="onThemeChange($event)"
              />
            </app-sidebar-group>
          </div>
        </app-sidebar>

        <app-layout direction="vertical" class="min-w-0 flex-1">
          <app-header class="px-3 md:hidden">
            <div class="flex items-center gap-2">
              <ng-icon name="phosphorScales" class="text-primary size-5 shrink-0" />
              <span class="text-base font-semibold">Pokémon Comparator</span>
            </div>
          </app-header>

          <app-content class="relative min-h-0 overflow-auto p-4 sm:p-6">
            <router-outlet />
            @if (navigating()) {
              <div class="bg-background absolute inset-0 z-10 flex flex-col gap-4 p-4 sm:p-6">
                <app-skeleton class="h-7 w-56" />
                <app-skeleton class="h-4 w-80 max-w-full" />
                <div class="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  @for (tile of skeletonTiles; track tile) {
                    <app-skeleton class="h-24" />
                  }
                </div>
              </div>
            }
          </app-content>
        </app-layout>
      </app-layout>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  protected readonly theme = inject(ThemeService);
  readonly #router = inject(Router);

  protected readonly themeItems = THEME_ITEMS;
  protected readonly sidebarCollapsed = signal(false);
  protected readonly skeletonTiles = [0, 1, 2, 3, 4, 5, 6, 7];

  protected readonly navigating = toSignal(
    this.#router.events.pipe(
      filter(
        (event): event is NavigationStart | NavigationEnd | NavigationCancel | NavigationError =>
          event instanceof NavigationStart ||
          event instanceof NavigationEnd ||
          event instanceof NavigationCancel ||
          event instanceof NavigationError,
      ),
      map(event => event instanceof NavigationStart),
    ),
    { initialValue: false },
  );

  protected readonly currentPath = toSignal(
    this.#router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(event => this.#normalizePath(event.urlAfterRedirects)),
    ),
    { initialValue: this.#normalizePath(this.#router.url) },
  );

  protected readonly navLinks = computed(() => {
    const current = this.currentPath();
    return NAV_ITEMS.map(item => ({ ...item, active: this.#isActive(item.path, current) }));
  });

  protected onThemeChange(value: string): void {
    this.theme.set(value === THEME_VALUE.dark ? THEME_VALUE.dark : THEME_VALUE.light);
  }

  #isActive(path: string, active: string): boolean {
    if (path === '') {
      return active === '';
    }
    return active === path || active.startsWith(`${path}/`);
  }

  #normalizePath(url: string): string {
    const path = url.split('?')[0]?.split('#')[0] ?? url;
    return path.replace(/^\/+/, '');
  }
}
