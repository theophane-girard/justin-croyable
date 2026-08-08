import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import {
  LayoutImports,
  SegmentComponent,
  type SegmentItem,
  ThemeService,
} from '@justin-croyable/design-system';
import { NgIcon } from '@ng-icons/core';

const THEME_VALUE = { light: 'light', dark: 'dark' } as const;

const THEME_ITEMS: readonly SegmentItem[] = [
  { value: THEME_VALUE.light, icon: 'phosphorSun', ariaLabel: 'Thème clair' },
  { value: THEME_VALUE.dark, icon: 'phosphorMoon', ariaLabel: 'Thème sombre' },
];

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ...LayoutImports, NgIcon, SegmentComponent],
  template: `
    <div class="bg-background text-foreground h-dvh overflow-hidden">
      <app-layout direction="vertical" class="h-full">
        <app-header class="px-4">
          <div class="flex items-center gap-2">
            <ng-icon name="phosphorScales" class="text-primary size-6 shrink-0" />
            <span class="text-base font-semibold">Pokémon Comparator</span>
          </div>
          <div class="ml-auto">
            <app-segment
              variant="accent"
              size="sm"
              [items]="themeItems"
              [value]="theme.theme()"
              (valueChange)="onThemeChange($event)"
            />
          </div>
        </app-header>

        <app-content class="min-h-0 overflow-auto p-4 sm:p-6">
          <router-outlet />
        </app-content>
      </app-layout>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  protected readonly theme = inject(ThemeService);

  protected readonly themeItems = THEME_ITEMS;

  protected onThemeChange(value: string): void {
    this.theme.set(value === THEME_VALUE.dark ? THEME_VALUE.dark : THEME_VALUE.light);
  }
}
