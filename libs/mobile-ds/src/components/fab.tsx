import { useEffect, useRef } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import type { Icon } from 'phosphor-react-native';

import { cn } from '../utils/cn';
import { Text } from './text';
import { useTheme } from '../theme/theme-provider';
import { channelsToRgb } from '../utils/color';
import type { ThemeColors } from '../theme/tokens';

const fabVariants = cva(
  'flex-row items-center justify-center rounded-full shadow-lg active:opacity-90',
  {
    variants: {
      variant: {
        primary: 'bg-primary',
        secondary: 'bg-secondary',
        destructive: 'bg-destructive',
      },
      extended: {
        true: 'h-14 gap-2 px-5',
        false: 'h-14 w-14',
      },
    },
    defaultVariants: { variant: 'primary', extended: false },
  }
);

const positionClasses = {
  'bottom-right': 'bottom-6 right-6',
  'bottom-left': 'bottom-6 left-6',
  'bottom-center': 'bottom-6 left-0 right-0 items-center',
} as const;

const foregroundToken: Record<string, keyof ThemeColors> = {
  primary: 'primaryForeground',
  secondary: 'secondaryForeground',
  destructive: 'destructiveForeground',
};

const labelClasses: Record<string, string> = {
  primary: 'text-primary-foreground',
  secondary: 'text-secondary-foreground',
  destructive: 'text-destructive-foreground',
};

export interface FabProps extends VariantProps<typeof fabVariants> {
  /** Composant d'icône Phosphor (ex. `Plus`). */
  icon: Icon;
  /** Libellé : sa présence active la variante « extended » (icône + texte). */
  label?: string;
  onPress?: () => void;
  /** Coin d'ancrage. */
  position?: keyof typeof positionClasses;
  /** Anime l'apparition / disparition. */
  visible?: boolean;
  accessibilityLabel: string;
  disabled?: boolean;
  className?: string;
}

/** Bouton d'action flottant, ancré au-dessus du contenu, avec animation d'entrée. */
export function Fab({
  icon: IconComponent,
  label,
  onPress,
  variant = 'primary',
  position = 'bottom-right',
  visible = true,
  accessibilityLabel,
  disabled = false,
  className,
}: FabProps) {
  const { colors } = useTheme();
  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: visible ? 1 : 0,
      useNativeDriver: false,
      friction: 7,
      tension: 120,
    }).start();
  }, [visible, progress]);

  const variantKey = variant ?? 'primary';
  const iconColor = channelsToRgb(colors[foregroundToken[variantKey]]);
  const extended = !!label;

  return (
    <View
      pointerEvents="box-none"
      className={cn('absolute', positionClasses[position])}
    >
      <Animated.View
        pointerEvents={visible ? 'auto' : 'none'}
        style={{ opacity: progress, transform: [{ scale: progress }] }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          accessibilityState={{ disabled }}
          disabled={disabled}
          onPress={onPress}
          className={cn(
            fabVariants({ variant, extended }),
            disabled && 'opacity-50',
            className
          )}
        >
          <IconComponent size={24} weight="bold" color={iconColor} />
          {label ? (
            <Text className={cn('font-semibold', labelClasses[variantKey])}>
              {label}
            </Text>
          ) : null}
        </Pressable>
      </Animated.View>
    </View>
  );
}
