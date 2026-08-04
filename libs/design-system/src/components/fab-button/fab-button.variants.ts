import { cva, type VariantProps } from 'class-variance-authority';

import { mergeClasses } from '../../utils/merge-classes';

export const fabButtonVariants = cva(
  mergeClasses(
    'inline-flex items-center justify-center shrink-0 rounded-full shadow-lg transition-all outline-none',
    'focus-visible:ring-ring/50 focus-visible:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
    'disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none',
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-6",
    '[&_ng-icon]:flex [&_ng-icon]:items-center',
    'hover:shadow-xl active:scale-95',
  ),
  {
    variants: {
      type: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/80',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40',
        outline:
          'border border-border bg-background hover:bg-muted hover:text-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
      },
      size: {
        default: "size-14 [&_svg:not([class*='size-'])]:size-6",
        sm: "size-10 [&_svg:not([class*='size-'])]:size-5",
        lg: "size-16 [&_svg:not([class*='size-'])]:size-7",
      },
      position: {
        static: '',
        'bottom-right': 'fixed bottom-6 right-6 z-50',
        'bottom-left': 'fixed bottom-6 left-6 z-50',
        'top-right': 'fixed top-6 right-6 z-50',
        'top-left': 'fixed top-6 left-6 z-50',
      },
      loading: {
        true: 'pointer-events-none opacity-50',
      },
      disabled: {
        true: 'pointer-events-none opacity-50',
      },
    },
    defaultVariants: {
      type: 'default',
      size: 'default',
      position: 'static',
    },
  },
);

export const fabContainerVariants = cva('w-fit', {
  variants: {
    position: {
      static: 'relative',
      'bottom-right': 'fixed bottom-6 right-6 z-50',
      'bottom-left': 'fixed bottom-6 left-6 z-50',
      'top-right': 'fixed top-6 right-6 z-50',
      'top-left': 'fixed top-6 left-6 z-50',
    },
  },
  defaultVariants: {
    position: 'bottom-right',
  },
});

export const fabListVariants = cva(
  mergeClasses(
    'absolute flex items-center gap-3',
    '[&>*]:transition-all [&>*]:duration-200 [&>*]:ease-out [&>*]:origin-center [&>*]:motion-reduce:transition-none',
  ),
  {
    variants: {
      side: {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-3 flex-col-reverse',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-3 flex-col',
        start: 'right-full top-1/2 -translate-y-1/2 mr-3 flex-row-reverse',
        end: 'left-full top-1/2 -translate-y-1/2 ml-3 flex-row',
      },
      open: {
        true: mergeClasses(
          'pointer-events-auto',
          '[&>*]:scale-100 [&>*]:opacity-100',
          '[&>*:nth-child(2)]:delay-[40ms] [&>*:nth-child(3)]:delay-[80ms]',
          '[&>*:nth-child(4)]:delay-[120ms] [&>*:nth-child(5)]:delay-[160ms]',
        ),
        false: 'pointer-events-none [&>*]:scale-0 [&>*]:opacity-0',
      },
    },
    defaultVariants: {
      side: 'top',
      open: false,
    },
  },
);

export type FabButtonType = NonNullable<
  VariantProps<typeof fabButtonVariants>['type']
>;
export type FabButtonSize = NonNullable<
  VariantProps<typeof fabButtonVariants>['size']
>;
export type FabButtonPosition = NonNullable<
  VariantProps<typeof fabButtonVariants>['position']
>;
export type FabListSide = NonNullable<
  VariantProps<typeof fabListVariants>['side']
>;
