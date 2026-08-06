import { cva, type VariantProps } from 'class-variance-authority';

export const segmentVariants = cva(
  'relative isolate inline-grid auto-cols-fr grid-flow-col items-center rounded-md p-1 select-none data-disabled:pointer-events-none data-disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-muted',
        accent: 'border border-border bg-background',
      },
      size: {
        sm: 'h-8',
        default: 'h-9',
        lg: 'h-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export const segmentIndicatorVariants = cva(
  'pointer-events-none absolute inset-y-1 left-1 rounded shadow-sm transition-[transform,width,opacity] duration-300 ease-out motion-reduce:transition-none',
  {
    variants: {
      variant: {
        default: 'bg-background',
        accent: 'bg-primary/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export const segmentItemVariants = cva(
  'relative z-10 inline-flex h-full items-center justify-center gap-1.5 rounded font-medium whitespace-nowrap outline-none transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_ng-icon]:flex [&_ng-icon]:items-center',
  {
    variants: {
      size: {
        sm: "px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        default: "px-3 text-sm [&_svg:not([class*='size-'])]:size-4",
        lg: "px-4 text-sm [&_svg:not([class*='size-'])]:size-4",
      },
      variant: {
        default: '',
        accent: '',
      },
      active: {
        true: '',
        false: 'text-muted-foreground hover:text-foreground',
      },
    },
    compoundVariants: [
      { variant: 'default', active: true, class: 'text-foreground' },
      { variant: 'accent', active: true, class: 'text-primary' },
    ],
    defaultVariants: {
      size: 'default',
      variant: 'default',
      active: false,
    },
  },
);

export type SegmentVariant = NonNullable<VariantProps<typeof segmentVariants>['variant']>;
export type SegmentSize = NonNullable<VariantProps<typeof segmentVariants>['size']>;
