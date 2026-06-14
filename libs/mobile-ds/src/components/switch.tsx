import { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { cn } from '../utils/cn';
import { useTheme } from '../theme/theme-provider';
import { channelsToRgb } from '../utils/color';

const TRACK_WIDTH = 48;
const TRACK_HEIGHT = 28;
const THUMB_SIZE = 24;
const PADDING = 2;
const TRAVEL = TRACK_WIDTH - THUMB_SIZE - PADDING * 2;

export interface SwitchProps
  extends Omit<PressableProps, 'onPress' | 'children' | 'style'> {
  /** État du switch. */
  value: boolean;
  /** Appelé avec la nouvelle valeur lors d'un appui. */
  onValueChange?: (value: boolean) => void;
  className?: string;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

/** Interrupteur on/off contrôlé et animé (glissement + transition de couleur). */
export function Switch({
  value,
  onValueChange,
  disabled = false,
  className,
  style,
  ...props
}: SwitchProps) {
  const { colors } = useTheme();
  const progress = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: value ? 1 : 0,
      duration: 180,
      useNativeDriver: false, // on anime une couleur (backgroundColor)
    }).start();
  }, [value, progress]);

  const trackColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [channelsToRgb(colors.input), channelsToRgb(colors.primary)],
  });
  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, TRAVEL],
  });

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => onValueChange?.(!value)}
      className={cn(disabled && 'opacity-50', className)}
      style={style}
      {...props}
    >
      <Animated.View
        style={{
          width: TRACK_WIDTH,
          height: TRACK_HEIGHT,
          borderRadius: TRACK_HEIGHT / 2,
          padding: PADDING,
          justifyContent: 'center',
          backgroundColor: trackColor,
        }}
      >
        <Animated.View
          style={{
            width: THUMB_SIZE,
            height: THUMB_SIZE,
            borderRadius: THUMB_SIZE / 2,
            backgroundColor: channelsToRgb(colors.background),
            transform: [{ translateX }],
            shadowColor: '#000',
            shadowOpacity: 0.2,
            shadowRadius: 2,
            shadowOffset: { width: 0, height: 1 },
            elevation: 2,
          }}
        />
      </Animated.View>
    </Pressable>
  );
}
