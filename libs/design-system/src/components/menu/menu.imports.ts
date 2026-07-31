import { ContextMenuDirective } from './context-menu.directive';
import { MenuContentDirective } from './menu-content.directive';
import { MenuItemDirective } from './menu-item.directive';
import { MenuLabelComponent } from './menu-label.component';
import { MenuShortcutComponent } from './menu-shortcut.component';
import { MenuDirective } from './menu.directive';

export const MenuImports = [
  ContextMenuDirective,
  MenuContentDirective,
  MenuItemDirective,
  MenuDirective,
  MenuLabelComponent,
  MenuShortcutComponent,
] as const;
