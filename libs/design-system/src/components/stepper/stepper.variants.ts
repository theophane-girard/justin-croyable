import { cva, type VariantProps } from 'class-variance-authority';

export const stepperVariants = cva('flex min-w-0 flex-col gap-6', {
  variants: {
    orientation: {
      horizontal: '',
      vertical: 'md:flex-row md:items-start md:gap-10',
    },
  },
  defaultVariants: {
    orientation: 'horizontal',
  },
});

export const stepperHeaderVariants = cva('flex min-w-0', {
  variants: {
    orientation: {
      horizontal: '',
      vertical: '',
    },
    header: {
      numbered: 'flex-row items-center gap-0.5 overflow-x-auto pb-1',
      dots: 'flex-row items-center justify-center gap-2.5',
      progress: 'flex-col gap-2',
    },
  },
  compoundVariants: [
    {
      orientation: 'vertical',
      header: 'numbered',
      class:
        'md:w-60 md:shrink-0 md:flex-col md:items-start md:gap-0 md:overflow-x-visible md:pb-0',
    },
    {
      orientation: 'vertical',
      header: 'dots',
      class: 'md:w-auto md:shrink-0 md:flex-col',
    },
  ],
  defaultVariants: {
    orientation: 'horizontal',
    header: 'numbered',
  },
});

export const stepperStepHeaderVariants = cva(
  'group flex min-w-0 shrink-0 items-center gap-2.5 rounded-md text-left outline-none transition-colors focus-visible:ring-ring/50 focus-visible:ring-2 aria-disabled:opacity-60',
  {
    variants: {
      size: {
        sm: 'px-1.5 py-1',
        default: 'px-2 py-1.5',
      },
      navigable: {
        true: 'cursor-pointer',
        false: 'cursor-default',
      },
    },
    defaultVariants: {
      size: 'default',
      navigable: true,
    },
  },
);

export const stepperIndicatorVariants = cva(
  'flex shrink-0 items-center justify-center rounded-full border font-medium tabular-nums transition-colors',
  {
    variants: {
      size: {
        sm: 'size-6 text-xs',
        default: 'size-8 text-sm',
      },
      state: {
        todo: 'border-border bg-background text-muted-foreground',
        active:
          'border-primary bg-primary text-primary-foreground ring-primary/25 ring-4',
        done: 'border-primary/40 bg-primary/15 text-primary',
        error: 'border-destructive bg-destructive/10 text-destructive',
      },
    },
    defaultVariants: {
      size: 'default',
      state: 'todo',
    },
  },
);

export const stepperDotVariants = cva('rounded-full transition-all', {
  variants: {
    state: {
      todo: 'bg-muted-foreground/30 size-2',
      active: 'bg-primary ring-primary/25 size-2.5 ring-4',
      done: 'bg-primary/60 size-2',
      error: 'bg-destructive size-2.5',
    },
  },
  defaultVariants: {
    state: 'todo',
  },
});

export const stepperLabelVariants = cva('flex min-w-0 flex-col', {
  variants: {
    size: {
      sm: 'text-xs',
      default: 'text-sm',
    },
    state: {
      todo: 'text-muted-foreground',
      active: 'text-foreground font-medium',
      done: 'text-foreground',
      error: 'text-destructive font-medium',
    },
  },
  defaultVariants: {
    size: 'default',
    state: 'todo',
  },
});

export const stepperConnectorVariants = cva(
  'h-px min-w-6 shrink-0 flex-1 self-center rounded-full transition-colors',
  {
    variants: {
      orientation: {
        horizontal: '',
        vertical: 'md:h-5 md:w-px md:min-w-0 md:flex-none md:self-start',
      },
      size: {
        sm: '',
        default: '',
      },
      done: {
        true: 'bg-primary/40',
        false: 'bg-border',
      },
    },
    compoundVariants: [
      { orientation: 'vertical', size: 'sm', class: 'md:ml-4.5' },
      { orientation: 'vertical', size: 'default', class: 'md:ml-6' },
    ],
    defaultVariants: {
      orientation: 'horizontal',
      size: 'default',
      done: false,
    },
  },
);

export const stepperContentVariants = cva(
  'min-w-0 flex-1 focus-visible:outline-none',
);

export const stepperFooterVariants = cva(
  'flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between',
);

export type StepperOrientationVariants = NonNullable<
  VariantProps<typeof stepperVariants>['orientation']
>;
export type StepperHeaderVariants = NonNullable<
  VariantProps<typeof stepperHeaderVariants>['header']
>;
export type StepperSizeVariants = NonNullable<
  VariantProps<typeof stepperIndicatorVariants>['size']
>;
export type StepperStateVariants = NonNullable<
  VariantProps<typeof stepperIndicatorVariants>['state']
>;
