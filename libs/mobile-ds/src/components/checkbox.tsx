import { useEffect, useRef } from 'react';
import { Animated, Pressable, type PressableProps } from 'react-native';

import { cn } from '../utils/cn';
import { Text } from './text';
import { useTheme } from '../theme/theme-provider';
import { channelsToRgb } from '../utils/color';

const BOX_SIZE = 20;

export interface CheckboxProps
  extends Omit<PressableProps, 'onPress' | 'children'> {
  /** État coché. */
  checked: boolean;
  /** Appelé avec la nouvelle valeur lors d'un appui. */
  onCheckedChange?: (checked: boolean) => void;
  /** Libellé affiché à droite de la case. */
  label?: string;
  className?: string;
  disabled?: boolean;
}

/** Case à cocher contrôlée et animée (le ✓ apparaît en pop, la couleur transitionne). */
export function Checkbox({
  checked,
  onCheckedChange,
  label,
  disabled = false,
  className,
  ...props
}: CheckboxProps) {
  const { colors } = useTheme();
  const progress = useRef(new Animated.Value(checked ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: checked ? 1 : 0,
      useNativeDriver: false, // on anime des couleurs
      friction: 7,
      tension: 120,
    }).start();
  }, [checked, progress]);

  const backgroundColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [channelsToRgb(colors.background), channelsToRgb(colors.primary)],
  });
  const borderColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [channelsToRgb(colors.input), channelsToRgb(colors.primary)],
  });

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={() => onCheckedChange?.(!checked)}
      className={cn('flex-row items-center gap-2', disabled && 'opacity-50')}
      {...props}
    >
      <Animated.View
        style={{
          width: BOX_SIZE,
          height: BOX_SIZE,
          borderRadius: 6,
          borderWidth: 1.5,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor,
          borderColor,
        }}
        className={className}
      >
        <Animated.View style={{ opacity: progress, transform: [{ scale: progress }] }}>
          <Text className="text-xs font-bold text-primary-foreground leading-none">
            ✓
          </Text>
        </Animated.View>
      </Animated.View>
      {label ? <Text variant="body">{label}</Text> : null}
    </Pressable>
  );
}
