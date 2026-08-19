import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

import {
  injectCurrentPath,
  isActivePath,
  LayoutImports,
  SegmentComponent,
  type SegmentItem,
  SkeletonComponent,
  SkeletonOutletComponent,
  SonnerComponent,
  ThemeService,
} from '@justin-croyable/design-system';
import { NgIcon } from '@ng-icons/core';

import { ACCESS_STATE, SessionStore } from './core/session-store';
import { AuthMenuComponent } from './features/auth/auth-menu.component';
import { ForbiddenComponent } from './features/auth/forbidden.component';
import { LoginComponent } from './features/auth/login.component';
import { APP_PATHS } from './app.routes';

type NavItem = {
  readonly path: string;
  readonly link: string;
  readonly label: string;
  readonly icon: string;
};

const NAV_ITEMS: readonly NavItem[] = [
  {
    path: APP_PATHS.profile,
    link: '/',
    label: 'Profil',
    icon: 'phosphorIdentificationCard',
  },
  {
    path: APP_PATHS.experiences,
    link: `/${APP_PATHS.experiences}`,
    label: 'Expériences',
    icon: 'phosphorBriefcase',
  },
  {
    path: APP_PATHS.skills,
    link: `/${APP_PATHS.skills}`,
    label: 'Compétences',
    icon: 'phosphorSparkle',
  },
  { path: APP_PATHS.tags, link: `/${APP_PATHS.tags}`, label: 'Tags', icon: 'phosphorTag' },
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
    SkeletonComponent,
    SkeletonOutletComponent,
    SonnerComponent,
    AuthMenuComponent,
    ForbiddenComponent,
    LoginComponent,
  ],
  template: `
    <app-sonner />
    @switch (access()) {
      @case (accessState.anonymous) {
        <app-login />
      }
      @case (accessState.forbidden) {
        <app-forbidden />
      }
      @case (accessState.pending) {
        <div class="bg-background flex h-dvh items-center justify-center">
          <app-skeleton class="h-10 w-40" />
        </div>
      }
      @default {
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
                    <ng-icon
                      name="phosphorIdentificationCard"
                      class="text-primary size-6 shrink-0"
                    />
                    <span class="text-base font-semibold" [class.hidden]="sidebarCollapsed()">
                      Mon CV
                    </span>
                  </div>
                  <app-sidebar-group-label [class.hidden]="sidebarCollapsed()">
                    Contenu
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
                  <p class="text-sm font-medium">Administration du CV</p>
                </div>
                <div class="ml-auto flex items-center gap-2">
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
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  protected readonly theme = inject(ThemeService);
  readonly #session = inject(SessionStore);

  protected readonly accessState = ACCESS_STATE;
  protected readonly access = this.#session.access;
  protected readonly sidebarCollapsed = signal(false);
  protected readonly currentPath = injectCurrentPath();

  protected readonly navLinks = computed(() => {
    const current = this.currentPath();
    return NAV_ITEMS.map(item => ({ ...item, active: isActivePath(item.path, current) }));
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
}
