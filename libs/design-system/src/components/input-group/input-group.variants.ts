import { cva, type VariantProps } from 'class-variance-authority';

import { mergeClasses } from '../../utils/merge-classes';

export const inputGroupVariants = cva(
  mergeClasses(
    'rounded-lg flex items-stretch w-full min-w-0 transition-colors',
    'border border-input dark:bg-input/30',
    '[&_input[app-input]]:border-0! [&_input[app-input]]:bg-transparent! [&_input[app-input]]:outline-none!',
    '[&_input[app-input]]:ring-0! [&_input[app-input]]:ring-offset-0! [&_input[app-input]]:px-0!',
    '[&_input[app-input]]:py-0! [&_input[app-input]]:h-full! [&_input[app-input]]:flex-1',
    '[&_textarea[app-input]]:border-0! [&_textarea[app-input]]:bg-transparent! [&_textarea[app-input]]:outline-none!',
    '[&_textarea[app-input]]:ring-0! [&_textarea[app-input]]:ring-offset-0! [&_textarea[app-input]]:px-2.5! [&_textarea[app-input]]:py-2!',
    'has-[textarea]:flex-col has-[textarea]:h-auto',
    // focus state
    'has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-3 has-[[data-slot=input-group-control]:focus-visible]:ring-ring/50',
    // disabled state
    'has-disabled:bg-input/50 has-disabled:opacity-50 dark:has-disabled:bg-input/80',
    // block align
    'has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col',
  ),
  {
    variants: {
      size: {
        sm: 'h-8',
        default: 'h-9',
        lg: 'h-10',
      },
      disabled: {
        true: 'cursor-not-allowed',
        false: '',
      },
    },
    defaultVariants: {
      size: 'default',
      disabled: false,
    },
  },
);

export const inputGroupAddonVariants = cva(
  'items-center gap-1 py-1.5 cursor-text whitespace-nowrap font-medium text-muted-foreground select-none transition-colors disabled:pointer-events-none disabled:opacity-50 [&>svg:not([class*=size-])]:size-4',
  {
    variants: {
      type: {
        default: 'justify-center',
        textarea: 'justify-start w-full',
      },
      size: {
        sm: 'text-sm',
        default: 'text-sm',
        lg: 'text-base',
      },
      position: {
        before: 'order-first',
        after: 'order-last',
      },
      disabled: {
        true: 'cursor-not-allowed opacity-50 pointer-events-none',
        false: '',
      },
      align: {
        block: 'flex',
        inline: 'inline-flex',
      },
    },
    defaultVariants: {
      align: 'inline',
      position: 'before',
      disabled: false,
      size: 'default',
    },
    compoundVariants: [
      {
        type: 'default',
        position: 'before',
        class: 'pl-2 has-[>button]:ml-[-0.3rem]',
      },
      {
        type: 'default',
        position: 'after',
        class: 'pr-2 has-[>button]:mr-[-0.3rem]',
      },
      {
        type: 'default',
        size: 'default',
        class: 'h-8.5',
      },
      {
        type: 'default',
        size: 'sm',
        class: 'h-7.5',
      },
      {
        type: 'default',
        size: 'lg',
        class: 'h-9.5',
      },
      {
        type: 'textarea',
        position: 'before',
        class: 'w-full justify-start px-3 pt-2',
      },
      {
        type: 'textarea',
        position: 'after',
        class: 'w-full justify-start px-3 pb-2',
      },
    ],
  },
);

export const inputGroupInputVariants = cva(
  mergeClasses(
    'font-normal flex has-[textarea]:h-auto w-full items-center rounded-lg bg-transparent ring-offset-background',
    'file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground',
    'focus-within:outline-none disabled:cursor-not-allowed disabled:bg-transparent disabled:opacity-50 transition-colors',
    'dark:bg-transparent dark:disabled:bg-transparent',
  ),
  {
    variants: {
      size: {
        sm: 'h-7.5 px-0.5 py-0 text-xs',
        default: 'h-8.5 px-0.5 py-0 text-sm',
        lg: 'h-9.5 px-0.5 py-0 text-base',
      },
      hasAddonBefore: {
        true: 'border-l-0 rounded-l-none',
        false: '',
      },
      hasAddonAfter: {
        true: 'border-r-0 rounded-r-none',
        false: '',
      },
      disabled: {
        true: 'cursor-not-allowed opacity-50',
        false: '',
      },
    },
    defaultVariants: {
      size: 'default',
      hasAddonBefore: false,
      hasAddonAfter: false,
      disabled: false,
    },
  },
);

export type InputGroupAddonAlignVariants = NonNullable<
  VariantProps<typeof inputGroupAddonVariants>['align']
>;
export type InputGroupAddonPositionVariants = NonNullable<
  VariantProps<typeof inputGroupAddonVariants>['position']
>;
