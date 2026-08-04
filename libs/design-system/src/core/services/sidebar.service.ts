import { Injectable, computed, signal } from '@angular/core';

/**
 * Holds the shared sidebar state.
 *
 * Lives in a service (rather than the root component) so the collapse toggle
 * and the mobile drawer can be driven from any page's header while the sidebar
 * itself — rendered by the app shell — reacts to the same signals.
 */
@Injectable({ providedIn: 'root' })
export class SidebarService {
  readonly collapsed = signal(false);
  readonly mobileOpen = signal(false);

  readonly #registeredCount = signal(0);
  readonly hasSidebar = computed(() => this.#registeredCount() > 0);

  toggle(): void {
    this.collapsed.update((collapsed) => !collapsed);
  }

  setCollapsed(collapsed: boolean): void {
    this.collapsed.set(collapsed);
  }

  openMobile(): void {
    this.mobileOpen.set(true);
  }

  closeMobile(): void {
    this.mobileOpen.set(false);
  }

  toggleMobile(): void {
    this.mobileOpen.update((open) => !open);
  }

  registerSidebar(): void {
    this.#registeredCount.update((count) => count + 1);
  }

  unregisterSidebar(): void {
    this.#registeredCount.update((count) => Math.max(0, count - 1));
    this.mobileOpen.set(false);
  }
}
