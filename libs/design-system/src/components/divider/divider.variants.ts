import { cva, type VariantProps } from 'class-variance-authority';

export const dividerVariants = cva('bg-border block', {
  variants: {
    orientation: {
      horizontal: 'h-px w-full',
      vertical: 'w-px h-full inline-block',
    },
    spacing: {
      none: '',
      sm: '',
      default: '',
      lg: '',
    },
  },
  defaultVariants: {
    orientation: 'horizontal',
    spacing: 'default',
  },
  compoundVariants: [
    {
      orientation: 'horizontal',
      spacing: 'sm',
      class: 'my-2',
    },
    {
      orientation: 'horizontal',
      spacing: 'default',
      class: 'my-4',
    },
    {
      orientation: 'horizontal',
      spacing: 'lg',
      class: 'my-8',
    },
    {
      orientation: 'vertical',
      spacing: 'sm',
      class: 'mx-2',
    },
    {
      orientation: 'vertical',
      spacing: 'default',
      class: 'mx-4',
    },
    {
      orientation: 'vertical',
      spacing: 'lg',
      class: 'mx-8',
    },
  ],
});

export type DividerVariants = VariantProps<typeof dividerVariants>;
