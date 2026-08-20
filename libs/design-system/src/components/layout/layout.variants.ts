import { cva, type VariantProps } from 'class-variance-authority';

// Layout Variants
export const layoutVariants = cva('flex w-full min-h-0', {
  variants: {
    direction: {
      horizontal: 'flex-row',
      vertical: 'flex-col',
      auto: 'flex-col',
    },
  },
  defaultVariants: {
    direction: 'auto',
  },
});
export type LayoutVariants = NonNullable<VariantProps<typeof layoutVariants>['direction']>;

// Header Variants
export const headerVariants = cva(
  'flex flex-col px-4 bg-background border-b border-border shrink-0',
  {
    variants: {},
  },
);

// Footer Variants
export const footerVariants = cva(
  'flex items-center px-6 bg-background border-t border-border shrink-0',
  {
    variants: {},
  },
);

// Content Variants
export const contentVariants = cva(
  'relative flex-1 flex flex-col overflow-auto [scrollbar-gutter:stable] bg-background p-6 min-h-dvh',
);

export const contentBodyVariants = cva('flex min-h-0 flex-1 flex-col');

// Espace de fin de page, pour que le dernier bloc d'une page longue ne colle
// pas au bas de l'écran (ni sous un bouton flottant). C'est une cale et non un
// retrait : un `pb-*` sur l'hôte n'allonge pas la zone défilante d'un conteneur
// flex dont les enfants débordent, et un `pb-*` sur le corps resterait dans sa
// boîte (hauteur figée par `flex-1 min-h-0`), donc au-dessus du débordement.
// Dernier enfant flex du corps, la cale suit le contenu et allonge le défilement.
// Corollaire pour le contenu projeté : il doit remplir la hauteur avec `flex-1`
// et non `min-h-full`, sinon son minimum absorbe la place de la cale.
export const contentSpacerVariants = cva('h-16 shrink-0');

// Sidebar Variants
export const sidebarVariants = cva(
  'relative flex flex-col h-full transition-all duration-300 ease-in-out border-r shrink-0 px-3 pt-6 pb-3 bg-sidebar text-sidebar-foreground border-sidebar-border',
);

export const sidebarTriggerVariants = cva(
  'absolute bottom-4 z-10 flex items-center justify-center cursor-pointer rounded-sm border border-sidebar-border bg-sidebar hover:bg-sidebar-accent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 size-6 -right-3',
);

// Sidebar Group Variants
export const sidebarGroupVariants = cva('flex flex-col gap-1');

export const sidebarGroupLabelVariants = cva(
  'flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70 outline-hidden transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 focus-visible:ring-sidebar-ring [&>svg]:size-4 [&>svg]:shrink-0',
);

// Sidebar Item Variants
export const sidebarItemVariants = cva(
  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
  {
    variants: {
      active: {
        true: 'bg-muted text-foreground font-medium',
        false: 'text-muted-foreground hover:bg-muted hover:text-foreground',
      },
    },
    defaultVariants: {
      active: false,
    },
  },
);
export type SidebarItemVariants = NonNullable<VariantProps<typeof sidebarItemVariants>['active']>;
