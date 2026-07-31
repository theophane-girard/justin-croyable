import { Injectable } from '@angular/core';

import type { MenuDirective } from './menu.directive';

@Injectable({
  providedIn: 'root',
})
export class MenuManagerService {
  private activeHoverMenu: MenuDirective | null = null;

  registerHoverMenu(menu: MenuDirective): void {
    if (this.activeHoverMenu && this.activeHoverMenu !== menu) {
      this.activeHoverMenu.close();
    }
    this.activeHoverMenu = menu;
  }

  unregisterHoverMenu(menu: MenuDirective): void {
    if (this.activeHoverMenu === menu) {
      this.activeHoverMenu = null;
    }
  }

  closeActiveMenu(): void {
    if (this.activeHoverMenu) {
      this.activeHoverMenu.close();
      this.activeHoverMenu = null;
    }
  }
}
