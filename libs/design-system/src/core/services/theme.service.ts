import { isPlatformBrowser } from '@angular/common';
import { computed, DOCUMENT, effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'theme';

/**
 * Manages the application color scheme by toggling the `.dark` class on the
 * document root (the class the Tailwind `dark` custom variant keys off).
 *
 * SSR-safe: `localStorage`/`matchMedia` are only touched in the browser, and
 * the initial theme falls back to `light` on the server.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly _theme = signal<Theme>(this.resolveInitialTheme());

  readonly theme = this._theme.asReadonly();
  readonly isDark = computed(() => this._theme() === 'dark');

  constructor() {
    effect(() => {
      const theme = this._theme();
      this.document.documentElement.classList.toggle('dark', theme === 'dark');

      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem(STORAGE_KEY, theme);
      }
    });
  }

  toggle(): void {
    this._theme.update((theme) => (theme === 'dark' ? 'light' : 'dark'));
  }

  set(theme: Theme): void {
    this._theme.set(theme);
  }

  private resolveInitialTheme(): Theme {
    if (!isPlatformBrowser(this.platformId)) {
      return 'light';
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }

    return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
