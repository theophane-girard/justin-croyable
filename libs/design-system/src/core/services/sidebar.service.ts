import { Injectable, signal } from '@angular/core';

/**
 * Holds the shared sidebar collapse state.
 *
 * Lives in a service (rather than the root component) so the collapse toggle
 * can be triggered from any page's header while the sidebar itself — rendered
 * by the app shell — reacts to the same signal.
 */
@Injectable({ providedIn: 'root' })
export class SidebarService {
  readonly collapsed = signal(false);

  toggle(): void {
    this.collapsed.update((collapsed) => !collapsed);
  }

  setCollapsed(collapsed: boolean): void {
    this.collapsed.set(collapsed);
  }
}
