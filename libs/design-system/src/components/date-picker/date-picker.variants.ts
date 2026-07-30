import { cva, type VariantProps } from 'class-variance-authority';

export const datePickerVariants = cva('', {
  variants: {
    size: {
      xs: '',
      sm: '',
      default: '',
      lg: '',
    },
    type: {
      default: '',
      outline: '',
      ghost: '',
    },
  },
  defaultVariants: {
    size: 'default',
    type: 'outline',
  },
});

export type DatePickerSizeVariants = NonNullable<VariantProps<typeof datePickerVariants>['size']>;
