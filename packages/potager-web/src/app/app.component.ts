import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

import {
  BadgeComponent,
  injectCurrentPath,
  isActivePath,
  LayoutImports,
  SegmentComponent,
  type SegmentItem,
  SelectImports,
  SkeletonComponent,
  SkeletonOutletComponent,
  SonnerComponent,
  ThemeService,
} from '@justin-croyable/design-system';
import { NgIcon } from '@ng-icons/core';

import { AUTH_GATE_ENABLED } from './core/app-config';
import { AuthService } from './core/auth.service';
import { GardenAccessStore } from './core/garden-access-store';
import { HarvestStore } from './core/harvest-store';
import { PRICE_MODE } from './core/potager.model';
import { AuthMenuComponent } from './features/auth/auth-menu.component';
import { LoginComponent } from './features/auth/login.component';
import { APP_PATHS } from './app.routes';

type NavItem = { readonly path: string; readonly link: string; readonly label: string; readonly icon: string };

const NAV_ITEMS: readonly NavItem[] = [
  { path: APP_PATHS.dashboard, link: '/', label: 'Tableau de bord', icon: 'phosphorSquaresFour' },
  { path: APP_PATHS.harvests, link: `/${APP_PATHS.harvests}`, label: 'Récoltes', icon: 'phosphorListBullets' },
  { path: APP_PATHS.expenses, link: `/${APP_PATHS.expenses}`, label: 'Dépenses', icon: 'phosphorReceipt' },
  { path: APP_PATHS.garden, link: `/${APP_PATHS.garden}`, label: 'Mon jardin', icon: 'phosphorPottedPlant' },
  { path: APP_PATHS.prices, link: `/${APP_PATHS.prices}`, label: 'Prix', icon: 'phosphorCoins' },
];

const THEME_VALUE = { light: 'light', dark: 'dark' } as const;

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    ...LayoutImports,
    NgIcon,
    SegmentComponent,
    BadgeComponent,
    ...SelectImports,
    SkeletonComponent,
    SkeletonOutletComponent,
    SonnerComponent,
    AuthMenuComponent,
    LoginComponent,
  ],
  template: `
    <app-sonner />
    @if (showLogin()) {
      <app-login />
    } @else if (showSplash()) {
      <div class="bg-background flex h-dvh items-center justify-center">
        <app-skeleton class="h-10 w-40" />
      </div>
    } @else {
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
                <div class="mb-2 flex items-center gap-2 px-2" [class.justify-center]="sidebarCollapsed()">
                  <ng-icon name="phosphorPlant" class="text-primary size-6 shrink-0" />
                  <span class="text-base font-semibold" [class.hidden]="sidebarCollapsed()">Mon Potager</span>
                </div>
                <app-sidebar-group-label [class.hidden]="sidebarCollapsed()">Navigation</app-sidebar-group-label>
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
                  [items]="themeItems()"
                  [value]="theme.theme()"
                  (valueChange)="onThemeChange($event)"
                />
              </app-sidebar-group>
            </div>
          </app-sidebar>

          <app-layout direction="vertical" class="min-w-0 flex-1">
            <app-header class="px-4">
              <div class="flex items-center gap-2">
                <p class="text-sm font-medium">Mon Potager</p>
              </div>
              <div class="ml-auto flex items-center gap-2">
                @if (access.hasMultiple()) {
                  <app-select
                    class="w-48"
                    prefixIcon="phosphorHouseLine"
                    [value]="access.activeId()"
                    (valueChange)="onGardenChange($event)"
                  >
                    @for (option of gardenOptions(); track option.id) {
                      <app-select-item [value]="option.id">{{ option.label }}</app-select-item>
                    }
                  </app-select>
                }
                @if (priceModeBio()) {
                  <app-badge type="secondary" class="gap-1">
                    <ng-icon name="phosphorLeaf" />
                    Prix bio
                  </app-badge>
                } @else {
                  <app-badge type="outline" class="gap-1">
                    <ng-icon name="phosphorBasket" />
                    Prix conventionnel
                  </app-badge>
                }
                <app-auth-menu />
              </div>
            </app-header>

            <app-content class="min-h-0 overflow-auto p-4">
              <app-skeleton-outlet class="min-h-full">
                <router-outlet />
              </app-skeleton-outlet>
            </app-content>
          </app-layout>
        </app-layout>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  protected readonly theme = inject(ThemeService);
  protected readonly access = inject(GardenAccessStore);
  readonly #store = inject(HarvestStore);
  readonly #auth = inject(AuthService);

  protected readonly gardenOptions = computed(() =>
    this.access.gardens().map(garden => ({
      id: garden.id,
      label: garden.ownerEmail ?? garden.name,
    })),
  );

  protected readonly sidebarCollapsed = signal(false);

  protected readonly currentPath = injectCurrentPath();

  protected readonly showSplash = computed(() => AUTH_GATE_ENABLED && !this.#auth.ready());
  protected readonly showLogin = computed(
    () => AUTH_GATE_ENABLED && this.#auth.ready() && !this.#auth.isAuthenticated(),
  );

  protected readonly priceModeBio = computed(() => this.#store.priceMode() === PRICE_MODE.bio);

  protected readonly navLinks = computed(() => {
    const current = this.currentPath();
    return NAV_ITEMS.map(item => ({
      ...item,
      active: isActivePath(item.path, current),
    }));
  });

  protected readonly themeItems = computed<SegmentItem[]>(() => {
    const collapsed = this.sidebarCollapsed();
    return [
      {
        value: THEME_VALUE.light,
        label: collapsed ? undefined : 'Clair',
        icon: 'phosphorSun',
        ariaLabel: 'Thème clair',
      },
      {
        value: THEME_VALUE.dark,
        label: collapsed ? undefined : 'Sombre',
        icon: 'phosphorMoon',
        ariaLabel: 'Thème sombre',
      },
    ];
  });

  protected onThemeChange(value: string): void {
    this.theme.set(value === THEME_VALUE.dark ? THEME_VALUE.dark : THEME_VALUE.light);
  }

  protected onGardenChange(value: string | string[] | null): void {
    if (typeof value === 'string') {
      this.access.setActive(value);
    }
  }
}
