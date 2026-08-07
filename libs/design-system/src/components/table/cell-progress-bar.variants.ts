import { cva, type VariantProps } from 'class-variance-authority';

export const cellProgressBarVariants = cva('', {
  variants: {
    color: {
      neutral: '[&_[data-slot=progress-indicator]]:bg-muted-foreground',
      primary: '',
      success: '[&_[data-slot=progress-indicator]]:bg-emerald-500',
      warning: '[&_[data-slot=progress-indicator]]:bg-amber-500',
      danger: '[&_[data-slot=progress-indicator]]:bg-rose-500',
      info: '[&_[data-slot=progress-indicator]]:bg-sky-500',
    },
  },
  defaultVariants: {
    color: 'primary',
  },
});

export type CellProgressBarColor = NonNullable<
  VariantProps<typeof cellProgressBarVariants>['color']
>;
