import React from 'react';
import { View, type ViewProps } from 'react-native';

import { cn } from '../utils/cn';
import { Text } from './text';

export interface CardProps extends ViewProps {
  className?: string;
}

/** Surface surélevée pour regrouper du contenu. */
export function Card({ className, ...props }: CardProps) {
  return (
    <View
      className={cn(
        'rounded-xl border border-border bg-card p-4 shadow-sm',
        className
      )}
      {...props}
    />
  );
}

/** En-tête de carte (titre + description). */
export function CardHeader({ className, ...props }: CardProps) {
  return <View className={cn('gap-1.5 pb-3', className)} {...props} />;
}

/** Titre de carte. */
export function CardTitle({
  className,
  ...props
}: React.ComponentProps<typeof Text>) {
  return (
    <Text
      variant="h4"
      className={cn('text-card-foreground', className)}
      {...props}
    />
  );
}

/** Description de carte (texte atténué). */
export function CardDescription({
  className,
  ...props
}: React.ComponentProps<typeof Text>) {
  return <Text variant="small" tone="muted" className={className} {...props} />;
}

/** Corps de la carte. */
export function CardContent({ className, ...props }: CardProps) {
  return <View className={cn('gap-2', className)} {...props} />;
}

/** Pied de carte (actions). */
export function CardFooter({ className, ...props }: CardProps) {
  return (
    <View
      className={cn('flex-row items-center gap-2 pt-4', className)}
      {...props}
    />
  );
}
