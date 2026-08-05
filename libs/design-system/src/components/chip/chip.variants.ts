import { cva, type VariantProps } from 'class-variance-authority';

export const chipVariants = cva(
  'inline-flex items-center gap-1 border py-0.5 pl-2.5 pr-1 text-xs font-medium w-fit whitespace-nowrap shrink-0 transition-[color,box-shadow] overflow-hidden',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-muted text-foreground',
        outline: 'border-border bg-transparent text-foreground',
        accent: 'border-transparent bg-secondary text-secondary-foreground',
      },
      shape: {
        default: 'rounded-md',
        pill: 'rounded-full',
      },
      disabled: {
        true: 'pointer-events-none opacity-50',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      shape: 'pill',
      disabled: false,
    },
  },
);

export type ChipVariant = NonNullable<VariantProps<typeof chipVariants>['variant']>;
export type ChipShape = NonNullable<VariantProps<typeof chipVariants>['shape']>;
