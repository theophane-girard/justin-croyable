import { cva, type VariantProps } from 'class-variance-authority';

import type { align } from './tabs.component';

export const tabContainerVariants = cva('flex', {
  variants: {
    position: {
      top: 'flex-col',
      bottom: 'flex-col',
      left: 'flex-row',
      right: 'flex-row',
    },
  },
  defaultVariants: {
    position: 'top',
  },
});

export const tabNavVariants = cva('flex gap-4 overflow-auto', {
  variants: {
    position: {
      top: 'flex-row border-b mb-4',
      bottom: 'flex-row border-t mt-4',
      left: 'flex-col border-r mr-4 min-h-0',
      right: 'flex-col border-l ml-4 min-h-0',
    },
    alignTabs: {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
    },
  },
  defaultVariants: {
    position: 'top',
    alignTabs: 'start',
  },
});

export const tabButtonVariants = cva('hover:bg-transparent rounded-none shrink-0', {
  variants: {
    activePosition: {
      top: '',
      bottom: '',
      left: '',
      right: '',
    },
    isActive: {
      true: '',
      false: '',
    },
  },
  compoundVariants: [
    {
      activePosition: 'top',
      isActive: true,
      class: 'border-t-2 border-t-primary',
    },
    {
      activePosition: 'bottom',
      isActive: true,
      class: 'border-b-2 border-b-primary',
    },
    {
      activePosition: 'left',
      isActive: true,
      class: 'border-l-2 border-l-primary',
    },
    {
      activePosition: 'right',
      isActive: true,
      class: 'border-r-2 border-r-primary',
    },
  ],
  defaultVariants: {
    activePosition: 'bottom',
    isActive: false,
  },
});

export type TabVariants = VariantProps<typeof tabContainerVariants> &
  VariantProps<typeof tabNavVariants> &
  VariantProps<typeof tabButtonVariants> & { alignTabs: align };
