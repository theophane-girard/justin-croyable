// Design System web (Angular) — @justin-croyable/design-system
//
// Composants zard : standalone, `ChangeDetectionStrategy.OnPush`,
// `ViewEncapsulation.None` (le style vient de Tailwind, pas du Shadow DOM).
// Chaque composant est aussi importable à l'unité :
//
//   import { ButtonComponent } from '@justin-croyable/design-system/components/button';
//
// Le thème (tokens + preset Tailwind) est du CSS, pas du TypeScript :
//   @import '@justin-croyable/design-system/styles.css';

// Utilitaires (mergeClasses / cn, helpers numériques)
export * from './utils';
// Cœur : directives, plugins d'event manager, `provideZard()`
export * from './core';
// Services `providedIn: 'root'` dont dépendent layout / breadcrumb / le thème.
// Absents du barrel `core` d'origine, mais nécessaires côté consommateur.
export * from './core/services/breadcrumb.service';
export * from './core/services/sidebar.service';
export * from './core/services/theme.service';
export * from './core/services/theme-palette.service';
export * from './core/services/viewport.service';

// Composants
export * from './components/avatar';
export * from './components/badge';
export * from './components/breadcrumb';
export * from './components/button';
export * from './components/calendar';
export * from './components/card';
export * from './components/chart';
export * from './components/checkbox';
export * from './components/chip';
export * from './components/combobox';
export * from './components/command';
export * from './components/date-picker';
export * from './components/dialog';
export * from './i18n';
export * from './providers';
export * from './components/divider';
export * from './components/empty';
export * from './components/fab-button';
export * from './components/input';
export * from './components/input-group';
export * from './components/kbd';
export * from './components/layout';
export * from './components/loader';
export * from './components/menu';
export * from './components/popover';
export * from './components/progress';
export * from './components/radio-group';
export * from './components/select';
export * from './components/segment';
export * from './components/separator';
export * from './components/sheet';
export * from './components/sheet-handle';
export * from './components/skeleton';
export * from './components/slider';
export * from './components/sonner';
export * from './components/spinner';
export * from './components/switch';
export * from './components/tabs';
export * from './components/table';
export * from './components/textarea';
export * from './components/toggle';
export * from './components/toggle-group';
export * from './components/tooltip';
