import { cva, type VariantProps } from 'class-variance-authority';

export const skeletonShimmerVariants = cva('bg-muted animate-skeleton');

export const skeletonVariants = cva('bg-muted animate-skeleton rounded-md');
export type SkeletonVariants = VariantProps<typeof skeletonVariants>;
