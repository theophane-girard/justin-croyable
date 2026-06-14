import type { ReactNode } from 'react';
import { View, type ViewProps } from 'react-native';
import { CaretLeft } from 'phosphor-react-native';

import { cn } from '../utils/cn';
import { Text } from './text';
import { IconButton } from './icon-button';

export interface HeaderProps extends Omit<ViewProps, 'children'> {
  /** Titre centré. */
  title?: string;
  /** Sous-titre affiché sous le titre. */
  subtitle?: string;
  /** Affiche un bouton retour à gauche et appelle ce callback au press. */
  onBack?: () => void;
  /** Contenu personnalisé à gauche (ignoré si `onBack` est fourni). */
  left?: ReactNode;
  /** Contenu à droite (boutons d'action). */
  right?: ReactNode;
  className?: string;
}

/** Barre de navigation : retour à gauche, titre centré, actions à droite. */
export function Header({
  title,
  subtitle,
  onBack,
  left,
  right,
  className,
  ...props
}: HeaderProps) {
  const leftContent = onBack ? (
    <IconButton
      icon={CaretLeft}
      accessibilityLabel="Retour"
      onPress={onBack}
    />
  ) : (
    left
  );

  return (
    <View
      className={cn(
        'h-14 flex-row items-center border-b border-border bg-background px-2',
        className
      )}
      {...props}
    >
      <View className="min-w-[40px] items-start">{leftContent}</View>

      <View className="flex-1 px-2">
        {title ? (
          <Text
            variant="h4"
            numberOfLines={1}
            className="text-center text-foreground"
          >
            {title}
          </Text>
        ) : null}
        {subtitle ? (
          <Text
            variant="caption"
            tone="muted"
            numberOfLines={1}
            className="text-center"
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View className="min-w-[40px] flex-row items-center justify-end gap-1">
        {right}
      </View>
    </View>
  );
}
