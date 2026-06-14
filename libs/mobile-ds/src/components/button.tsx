import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
} from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../utils/cn';
import { Text } from './text';

const buttonVariants = cva(
  'flex-row items-center justify-center rounded-lg gap-2',
  {
    variants: {
      variant: {
        primary: 'bg-primary active:opacity-90',
        secondary: 'bg-secondary active:opacity-90',
        destructive: 'bg-destructive active:opacity-90',
        outline: 'border border-input bg-transparent active:bg-accent',
        ghost: 'bg-transparent active:bg-accent',
      },
      size: {
        sm: 'h-9 px-3',
        default: 'h-11 px-5',
        lg: 'h-12 px-6',
        icon: 'h-11 w-11',
      },
      disabled: {
        true: 'opacity-50',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

const labelVariants = cva('text-base font-semibold', {
  variants: {
    variant: {
      primary: 'text-primary-foreground',
      secondary: 'text-secondary-foreground',
      destructive: 'text-destructive-foreground',
      outline: 'text-foreground',
      ghost: 'text-foreground',
    },
    size: {
      sm: 'text-sm',
      default: 'text-base',
      lg: 'text-base',
      icon: 'text-base',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'default',
  },
});

export interface ButtonProps
  extends Omit<PressableProps, 'children' | 'disabled'>,
    VariantProps<typeof buttonVariants> {
  className?: string;
  /** Libellé (raccourci) ou contenu personnalisé. */
  children?: React.ReactNode;
  /** Affiche un indicateur de chargement et désactive le bouton. */
  loading?: boolean;
  disabled?: boolean;
  /** Élément rendu avant le libellé (icône). */
  leftIcon?: React.ReactNode;
  /** Élément rendu après le libellé (icône). */
  rightIcon?: React.ReactNode;
}

/** Bouton principal du Design System, avec variantes, tailles et état de chargement. */
export function Button({
  className,
  variant,
  size,
  children,
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      className={cn(
        buttonVariants({ variant, size, disabled: isDisabled }),
        className
      )}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" />
      ) : (
        <>
          {leftIcon}
          {typeof children === 'string' ? (
            <Text className={cn(labelVariants({ variant, size }))}>
              {children}
            </Text>
          ) : (
            children
          )}
          {rightIcon}
        </>
      )}
    </Pressable>
  );
}
