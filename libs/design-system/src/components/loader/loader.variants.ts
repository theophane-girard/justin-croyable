import { cva, type VariantProps } from 'class-variance-authority';

export const loaderVariants = cva('', {
  variants: {
    size: {
      default: 'size-6',
      sm: 'size-4',
      lg: 'size-8',
    },
  },
  defaultVariants: {
    size: 'default',
  },
});
export type LoaderVariants = VariantProps<typeof loaderVariants>;
