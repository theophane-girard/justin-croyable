import { cva } from 'class-variance-authority';

export const pageSkeletonVariants = cva('flex flex-col gap-4');

export const pageSkeletonCenteredVariants = cva('mx-auto flex w-full flex-col gap-4', {
  variants: {
    width: {
      form: 'max-w-2xl',
      detail: 'max-w-3xl',
    },
  },
  defaultVariants: {
    width: 'form',
  },
});

export const pageSkeletonStatGridVariants = cva('grid grid-cols-1 gap-4', {
  variants: {
    columns: {
      three: 'sm:grid-cols-3',
      four: 'sm:grid-cols-2 xl:grid-cols-4',
    },
  },
  defaultVariants: {
    columns: 'four',
  },
});

export const pageSkeletonStatTileVariants = cva('h-24 rounded-xl');

export const pageSkeletonBlockVariants = cva(
  'border-border flex flex-col gap-3 rounded-xl border p-4',
);

export const pageSkeletonTileGridVariants = cva(
  'grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5',
);
