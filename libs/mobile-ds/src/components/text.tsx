import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../utils/cn';

const textVariants = cva('text-foreground', {
  variants: {
    variant: {
      h1: 'text-4xl font-extrabold tracking-tight',
      h2: 'text-3xl font-bold tracking-tight',
      h3: 'text-2xl font-semibold',
      h4: 'text-xl font-semibold',
      body: 'text-base',
      bodyLarge: 'text-lg',
      small: 'text-sm',
      caption: 'text-xs',
    },
    tone: {
      default: 'text-foreground',
      muted: 'text-muted-foreground',
      primary: 'text-primary',
      destructive: 'text-destructive',
      success: 'text-success',
    },
    weight: {
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    },
  },
  defaultVariants: {
    variant: 'body',
    tone: 'default',
  },
});

export interface TextProps
  extends RNTextProps,
    VariantProps<typeof textVariants> {
  className?: string;
}

/** Texte typé du Design System (titres, corps, légendes). */
export function Text({
  className,
  variant,
  tone,
  weight,
  ...props
}: TextProps) {
  return (
    <RNText
      className={cn(textVariants({ variant, tone, weight }), className)}
      {...props}
    />
  );
}
