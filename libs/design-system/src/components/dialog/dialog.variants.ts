import { cva, type VariantProps } from 'class-variance-authority';

export const dialogVariants = cva(
  [
    'fixed inset-x-0 bottom-0 z-50 grid w-full gap-4 rounded-t-xl',
    'bg-popover p-4 text-sm text-popover-foreground ring-1 ring-foreground/10 outline-none',
    'sm:inset-x-auto sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:max-w-sm sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl',
  ].join(' '),
);

export const dialogHeaderVariants = cva('flex flex-col gap-2');

export const dialogTitleVariants = cva('text-base leading-none font-medium');

export const dialogDescriptionVariants = cva(
  'text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-[3px] *:[a]:hover:text-foreground',
);

export const dialogFooterVariants = cva(
  '-mx-4 -mb-4 flex flex-col-reverse gap-2 rounded-b-none border-t bg-muted/50 p-4 sm:flex-row sm:justify-end sm:rounded-b-xl',
);

export type DialogVariants = VariantProps<typeof dialogVariants>;
