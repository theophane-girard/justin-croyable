import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, NavigationStart, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';

import {
  AvatarComponent,
  ButtonComponent,
  injectCurrentPath,
  isActivePath,
  LayoutImports,
  SegmentComponent,
  type SegmentItem,
  SelectImports,
  SheetService,
  SkeletonComponent,
  SkeletonOutletComponent,
  SonnerComponent,
  ThemeService,
} from '@justin-croyable/design-system';
import { GARDEN_ROLE } from '@justin-croyable/api-contract';
import { NgIcon } from '@ng-icons/core';

import { AUTH_GATE_ENABLED } from './core/app-config';
import { AuthService } from './core/auth.service';
import { GardenAccessStore } from './core/garden-access-store';
import { LoginComponent } from './features/auth/login.component';
import { APP_PATHS } from './app.routes';

type NavItem = { readonly path: string; readonly link: string; readonly label: string; readonly icon: string };

const NAV_ITEMS: readonly NavItem[] = [
  { path: APP_PATHS.dashboard, link: '/', label: 'Tableau de bord', icon: 'phosphorSquaresFour' },
  { path: APP_PATHS.harvests, link: `/${APP_PATHS.harvests}`, label: 'Récoltes', icon: 'phosphorListBullets' },
  { path: APP_PATHS.expenses, link: `/${APP_PATHS.expenses}`, label: 'Dépenses', icon: 'phosphorReceipt' },
  { path: APP_PATHS.garden, link: `/${APP_PATHS.garden}`, label: 'Mon jardin', icon: 'phosphorPottedPlant' },
  { path: APP_PATHS.prices, link: `/${APP_PATHS.prices}`, label: 'Prix', icon: 'phosphorCoins' },
  { path: APP_PATHS.rankings, link: `/${APP_PATHS.rankings}`, label: 'Classement', icon: 'phosphorTrophy' },
];

const APP_NAME = 'Mon Potager';

const PAGE_TITLES: Readonly<Record<string, string>> = {
  [APP_PATHS.dashboard]: 'Tableau de bord',
  [APP_PATHS.harvests]: 'Récoltes',
  [`${APP_PATHS.harvests}/${APP_PATHS.add}`]: 'Ajouter une récolte',
  [APP_PATHS.expenses]: 'Dépenses',
  [`${APP_PATHS.expenses}/${APP_PATHS.add}`]: 'Ajouter une dépense',
  [APP_PATHS.garden]: 'Mon jardin',
  [`${APP_PATHS.garden}/${APP_PATHS.add}`]: 'Ajouter un plant',
  [APP_PATHS.prices]: 'Prix',
  [APP_PATHS.rankings]: 'Classement',
};

function normalizeUrlPath(url: string): string {
  const path = url.split('?')[0]?.split('#')[0] ?? url;
  return path.replace(/^\/+/, '');
}

const THEME_VALUE = { light: 'light', dark: 'dark' } as const;

function initialsOf(label: string): string {
  return label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('');
}

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    ...LayoutImports,
    NgIcon,
    AvatarComponent,
    ButtonComponent,
    SegmentComponent,
    ...SelectImports,
    SkeletonComponent,
    SkeletonOutletComponent,
    SonnerComponent,
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
                  <span class="text-base font-semibold" [class.hidden]="sidebarCollapsed()">{{ appName }}</span>
                </div>

                @if (!sidebarCollapsed() && access.hasMultiple()) {
                  <div class="mb-2 flex flex-col gap-2 px-2">
                    <app-select
                      class="w-full"
                      prefixIcon="phosphorHouseLine"
                      [value]="access.activeId()"
                      (valueChange)="onGardenChange($event)"
                    >
                      @for (option of gardenOptions(); track option.id) {
                        <app-select-item [value]="option.id">{{ option.label }}</app-select-item>
                      }
                    </app-select>
                    <div class="flex items-center justify-end gap-1">
                      <button
                        appButton
                        variant="ghost"
                        size="sm"
                        [attr.aria-label]="defaultLabel()"
                        [buttonDisabled]="access.activeIsDefault()"
                        (click)="onSetDefault()"
                      >
                        <ng-icon [name]="defaultStarIcon()" [class]="defaultStarClass()" />
                      </button>
                      <button
                        appButton
                        variant="ghost"
                        size="sm"
                        [attr.aria-label]="deleteLabel()"
                        (click)="openDeleteGarden()"
                      >
                        <ng-icon [name]="deleteIcon()" [class]="deleteIconClass()" />
                      </button>
                    </div>
                  </div>
                }

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
                <button
                  type="button"
                  class="hover:bg-accent flex w-full items-center gap-2 rounded-md p-2 text-left"
                  [class.justify-center]="sidebarCollapsed()"
                  (click)="openUserMenu()"
                >
                  <app-avatar size="sm" [src]="avatarSrc()" [alt]="displayName()" [fallback]="initials()" />
                  @if (!sidebarCollapsed()) {
                    <span class="min-w-0 flex-1 truncate text-sm font-medium">{{ displayName() }}</span>
                    <ng-icon name="phosphorArrowSquareOut" class="text-muted-foreground size-4 shrink-0" />
                  }
                </button>
              </app-sidebar-group>
            </div>
          </app-sidebar>

          <app-layout direction="vertical" class="min-w-0 flex-1">
            <app-header class="px-4">
              <div class="flex items-center gap-2">
                <p class="text-sm font-medium">{{ pageTitle() }}</p>
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

      <ng-template #userSheet>
        <div class="flex flex-col gap-4 p-4">
          <div class="flex items-center gap-3">
            <app-avatar [src]="avatarSrc()" [alt]="displayName()" [fallback]="initials()" />
            <div class="flex min-w-0 flex-col">
              <span class="truncate text-sm font-medium">{{ displayName() }}</span>
              <span class="text-muted-foreground truncate text-xs">{{ email() }}</span>
            </div>
          </div>
          <div class="flex items-center justify-between gap-2">
            <span class="text-sm font-medium">Thème</span>
            <app-segment
              variant="accent"
              [items]="themeItems()"
              [value]="theme.theme()"
              (valueChange)="onThemeChange($event)"
            />
          </div>
          <button appButton variant="outline" (click)="onSignOut()">
            <ng-icon name="phosphorSignOut" class="size-4" />
            Se déconnecter
          </button>
        </div>
      </ng-template>

      <ng-template #deleteGardenSheet>
        <div class="flex flex-col gap-2 p-4">
          <p class="text-sm">{{ deleteConfirmMessage() }}</p>
        </div>
      </ng-template>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  protected readonly theme = inject(ThemeService);
  protected readonly access = inject(GardenAccessStore);
  readonly #auth = inject(AuthService);
  readonly #sheet = inject(SheetService);

  protected readonly appName = APP_NAME;

  private readonly userSheetTemplate = viewChild.required<TemplateRef<unknown>>('userSheet');
  private readonly deleteGardenSheetTemplate = viewChild.required<TemplateRef<unknown>>('deleteGardenSheet');

  protected readonly sidebarCollapsed = signal(false);

  protected readonly currentPath = injectCurrentPath();

  readonly #router = inject(Router);
  readonly #titlePath = toSignal(
    this.#router.events.pipe(
      filter(
        (event): event is NavigationStart | NavigationEnd =>
          event instanceof NavigationStart || event instanceof NavigationEnd,
      ),
      map(event =>
        normalizeUrlPath(event instanceof NavigationStart ? event.url : event.urlAfterRedirects),
      ),
    ),
    { initialValue: normalizeUrlPath(this.#router.url) },
  );

  protected readonly showSplash = computed(() => AUTH_GATE_ENABLED && !this.#auth.ready());
  protected readonly showLogin = computed(
    () => AUTH_GATE_ENABLED && this.#auth.ready() && !this.#auth.isAuthenticated(),
  );

  protected readonly pageTitle = computed(() => PAGE_TITLES[this.#titlePath()] ?? APP_NAME);

  readonly #currentUser = this.#auth.user;

  protected readonly displayName = computed(() => {
    const user = this.#currentUser();
    return user?.displayName ?? user?.email ?? 'Utilisateur';
  });
  protected readonly email = computed(() => this.#currentUser()?.email ?? '');
  protected readonly avatarSrc = computed(() => this.#currentUser()?.photoURL ?? '');
  protected readonly initials = computed(() => {
    const user = this.#currentUser();
    if (user?.displayName) {
      return initialsOf(user.displayName);
    }
    const userEmail = user?.email ?? '';
    return userEmail ? userEmail.slice(0, 2).toUpperCase() : '?';
  });

  protected readonly gardenOptions = computed(() =>
    this.access.gardens().map(garden => ({
      id: garden.id,
      label: garden.name,
    })),
  );

  protected readonly activeIsOwner = computed(() => this.access.active()?.role === GARDEN_ROLE.owner);
  protected readonly deleteLabel = computed(() => (this.activeIsOwner() ? 'Supprimer' : 'Quitter'));
  protected readonly deleteIcon = computed(() =>
    this.activeIsOwner() ? 'phosphorTrash' : 'phosphorSignOut',
  );
  protected readonly deleteIconClass = computed(() =>
    this.activeIsOwner() ? 'size-4 text-destructive' : 'size-4',
  );
  protected readonly defaultStarIcon = computed(() =>
    this.access.activeIsDefault() ? 'phosphorStarFill' : 'phosphorStar',
  );
  protected readonly defaultStarClass = computed(() =>
    this.access.activeIsDefault() ? 'size-4 text-amber-500' : 'size-4',
  );
  protected readonly defaultLabel = computed(() =>
    this.access.activeIsDefault() ? 'Jardin par défaut' : 'Définir comme jardin par défaut',
  );
  protected readonly deleteConfirmMessage = computed(() =>
    this.activeIsOwner()
      ? 'Supprimer définitivement ce jardin et toutes ses données ?'
      : 'Quitter ce jardin partagé ?',
  );

  protected readonly navLinks = computed(() => {
    const current = this.currentPath();
    return NAV_ITEMS.map(item => ({
      ...item,
      active: isActivePath(item.path, current),
    }));
  });

  protected readonly themeItems = computed<SegmentItem[]>(() => [
    { value: THEME_VALUE.light, label: 'Clair', icon: 'phosphorSun', ariaLabel: 'Thème clair' },
    { value: THEME_VALUE.dark, label: 'Sombre', icon: 'phosphorMoon', ariaLabel: 'Thème sombre' },
  ]);

  protected onThemeChange(value: string): void {
    this.theme.set(value === THEME_VALUE.dark ? THEME_VALUE.dark : THEME_VALUE.light);
  }

  protected onGardenChange(value: string | string[] | null): void {
    if (typeof value === 'string') {
      this.access.setActive(value);
    }
  }

  protected onSetDefault(): void {
    const id = this.access.active()?.id;
    if (id) {
      void this.access.setDefault(id);
    }
  }

  protected openUserMenu(): void {
    this.#sheet.create({
      title: 'Mon compte',
      side: 'bottom',
      hideFooter: true,
      content: this.userSheetTemplate(),
    });
  }

  protected openDeleteGarden(): void {
    this.#sheet.create({
      title: this.deleteLabel(),
      side: 'bottom',
      okText: this.deleteLabel(),
      cancelText: 'Annuler',
      content: this.deleteGardenSheetTemplate(),
      onOk: () => void this.#confirmDeleteGarden(),
    });
  }

  async #confirmDeleteGarden(): Promise<void> {
    const id = this.access.active()?.id;
    if (id) {
      await this.access.remove(id);
    }
  }

  protected onSignOut(): void {
    this.#auth.signOut().catch(() => undefined);
  }
}
