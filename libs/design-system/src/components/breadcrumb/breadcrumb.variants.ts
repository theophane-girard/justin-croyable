import { cva, type VariantProps } from 'class-variance-authority';

export const breadcrumbVariants = cva('w-full', {
  variants: {
    size: {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});
export type BreadcrumbSizeVariants = NonNullable<VariantProps<typeof breadcrumbVariants>['size']>;

export const breadcrumbListVariants = cva(
  'text-muted-foreground flex flex-wrap items-center gap-1.5 wrap-break-word sm:gap-2.5',
  {
    variants: {
      align: {
        start: 'justify-start',
        center: 'justify-center',
        end: 'justify-end',
      },
      wrap: {
        wrap: 'flex-wrap',
        nowrap: 'flex-nowrap',
      },
    },
    defaultVariants: {
      align: 'start',
      wrap: 'wrap',
    },
  },
);
export type BreadcrumbAlignVariants = NonNullable<VariantProps<typeof breadcrumbListVariants>['align']>;
export type BreadcrumbWrapVariants = NonNullable<VariantProps<typeof breadcrumbListVariants>['wrap']>;

export const breadcrumbItemVariants = cva(
  'inline-flex items-center gap-1.5 transition-colors cursor-pointer hover:text-foreground last:text-foreground last:font-normal last:pointer-events-none',
);
export type BreadcrumbItemVariants = VariantProps<typeof breadcrumbItemVariants>;

export const breadcrumbEllipsisVariants = cva('flex', {
  variants: {
    color: {
      muted: 'text-muted-foreground',
      strong: 'text-foreground',
    },
  },
  defaultVariants: {
    color: 'muted',
  },
});
export type BreadcrumbEllipsisColorVariants = NonNullable<
  VariantProps<typeof breadcrumbEllipsisVariants>['color']
>;
