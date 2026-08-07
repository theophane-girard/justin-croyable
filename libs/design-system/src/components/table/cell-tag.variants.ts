import { cva, type VariantProps } from 'class-variance-authority';

export const cellTagVariants = cva('max-w-full', {
  variants: {
    color: {
      neutral: 'border-transparent bg-muted text-muted-foreground',
      primary: 'border-transparent bg-primary/10 text-primary',
      success: 'border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
      warning: 'border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-500',
      danger: 'border-transparent bg-rose-500/15 text-rose-700 dark:text-rose-400',
      info: 'border-transparent bg-sky-500/15 text-sky-700 dark:text-sky-400',
    },
  },
  defaultVariants: {
    color: 'neutral',
  },
});

export type CellTagColor = NonNullable<VariantProps<typeof cellTagVariants>['color']>;
