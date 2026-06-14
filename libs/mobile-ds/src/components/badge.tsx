import React from 'react';
import { View, type ViewProps } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../utils/cn';
import { Text } from './text';

const badgeVariants = cva('self-start rounded-full px-2.5 py-0.5', {
  variants: {
    variant: {
      primary: 'bg-primary',
      secondary: 'bg-secondary',
      destructive: 'bg-destructive',
      success: 'bg-success',
      outline: 'border border-border bg-transparent',
    },
  },
  defaultVariants: {
    variant: 'primary',
  },
});

const badgeLabelVariants = cva('text-xs font-semibold', {
  variants: {
    variant: {
      primary: 'text-primary-foreground',
      secondary: 'text-secondary-foreground',
      destructive: 'text-destructive-foreground',
      success: 'text-success-foreground',
      outline: 'text-foreground',
    },
  },
  defaultVariants: {
    variant: 'primary',
  },
});

export interface BadgeProps
  extends ViewProps,
    VariantProps<typeof badgeVariants> {
  className?: string;
  children?: React.ReactNode;
}

/** Pastille d'état ou de catégorie. */
export function Badge({ className, variant, children, ...props }: BadgeProps) {
  return (
    <View className={cn(badgeVariants({ variant }), className)} {...props}>
      {typeof children === 'string' ? (
        <Text className={cn(badgeLabelVariants({ variant }))}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}
