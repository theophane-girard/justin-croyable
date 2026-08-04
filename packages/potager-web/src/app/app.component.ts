import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';

import {
  BadgeComponent,
  ButtonComponent,
  LayoutImports,
  ThemeService,
} from '@justin-croyable/design-system';
import { NgIcon } from '@ng-icons/core';

import { HarvestStore } from './core/harvest-store';
import { APP_PATHS } from './app.routes';

type NavItem = { readonly path: string; readonly link: string; readonly label: string; readonly icon: string };

const NAV_ITEMS: readonly NavItem[] = [
  { path: APP_PATHS.dashboard, link: '/', label: 'Tableau de bord', icon: 'phosphorSquaresFour' },
  { path: APP_PATHS.harvests, link: `/${APP_PATHS.harvests}`, label: 'Récoltes', icon: 'phosphorListBullets' },
];

const NAV_ITEM_BASE_CLASS =
  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors';
const NAV_ITEM_ACTIVE_CLASS = `${NAV_ITEM_BASE_CLASS} bg-muted text-foreground font-medium`;
const NAV_ITEM_IDLE_CLASS = `${NAV_ITEM_BASE_CLASS} text-muted-foreground hover:bg-muted hover:text-foreground`;

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, ...LayoutImports, NgIcon, ButtonComponent, BadgeComponent],
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
            <app-sidebar-group class="p-3">
              <div class="mb-2 flex items-center gap-2 px-2" [class.justify-center]="sidebarCollapsed()">
                <ng-icon name="phosphorPlant" class="text-primary size-6 shrink-0" />
                <span class="text-base font-semibold" [class.hidden]="sidebarCollapsed()">Mon Potager</span>
              </div>
              <app-sidebar-group-label [class.hidden]="sidebarCollapsed()">Navigation</app-sidebar-group-label>
              @for (item of navLinks(); track item.path) {
                <a
                  [routerLink]="item.link"
                  [class]="item.cssClass"
                  [class.justify-center]="sidebarCollapsed()"
                  [attr.title]="sidebarCollapsed() ? item.label : null"
                >
                  <ng-icon [name]="item.icon" class="size-4 shrink-0" />
                  <span [class.hidden]="sidebarCollapsed()">{{ item.label }}</span>
                </a>
              }
            </app-sidebar-group>

            <app-sidebar-group class="mt-auto p-3">
              <button
                appButton
                variant="ghost"
                size="sm"
                class="w-full justify-start gap-2"
                [class.justify-center]="sidebarCollapsed()"
                (click)="theme.toggle()"
                [attr.title]="sidebarCollapsed() ? (theme.isDark() ? 'Thème clair' : 'Thème sombre') : null"
                [attr.aria-label]="theme.isDark() ? 'Passer en thème clair' : 'Passer en thème sombre'"
              >
                <ng-icon [name]="theme.isDark() ? 'phosphorSun' : 'phosphorMoon'" class="size-4 shrink-0" />
                <span [class.hidden]="sidebarCollapsed()">{{ theme.isDark() ? 'Thème clair' : 'Thème sombre' }}</span>
              </button>
            </app-sidebar-group>
          </div>
        </app-sidebar>

        <app-layout direction="vertical" class="min-w-0 flex-1">
          <app-header class="px-4">
            <div class="flex items-center gap-2">
              <p class="text-sm font-medium">Récoltes & économies</p>
            </div>
            <div class="ml-auto flex items-center gap-2">
              @if (priceSourceLive()) {
                <app-badge type="secondary" class="gap-1">
                  <ng-icon name="phosphorCloudArrowDown" />
                  Prix RNM en direct
                </app-badge>
              } @else {
                <app-badge type="outline" class="gap-1">
                  <ng-icon name="phosphorInfo" />
                  Prix de référence
                </app-badge>
              }
            </div>
          </app-header>

          <app-content class="min-h-0 overflow-auto p-4">
            <router-outlet />
          </app-content>

          <app-footer class="text-muted-foreground flex items-center px-4 text-xs">
            Économies estimées d'après les prix moyens des fruits et légumes en France (FranceAgriMer — RNM).
          </app-footer>
        </app-layout>
      </app-layout>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  protected readonly theme = inject(ThemeService);
  readonly #store = inject(HarvestStore);
  readonly #router = inject(Router);

  protected readonly sidebarCollapsed = signal(false);

  protected readonly priceSourceLive = computed(() => this.#store.priceSource() === 'live');

  protected readonly currentPath = toSignal(
    this.#router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(event => this.#normalizePath(event.urlAfterRedirects)),
    ),
    { initialValue: this.#normalizePath(this.#router.url) },
  );

  protected readonly navLinks = computed(() => {
    const active = this.currentPath();
    return NAV_ITEMS.map(item => ({
      ...item,
      cssClass: item.path === active ? NAV_ITEM_ACTIVE_CLASS : NAV_ITEM_IDLE_CLASS,
    }));
  });

  #normalizePath(url: string): string {
    const path = url.split('?')[0]?.split('#')[0] ?? url;
    return path.replace(/^\/+/, '');
  }
}
