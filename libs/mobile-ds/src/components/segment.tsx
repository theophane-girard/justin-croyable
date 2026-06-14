import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, View, type ViewProps } from 'react-native';

import { cn } from '../utils/cn';
import { Text } from './text';
import { useTheme } from '../theme/theme-provider';
import { channelsToRgb } from '../utils/color';

const PADDING = 4;

export interface SegmentOption {
  label: string;
  value: string;
}

export interface SegmentProps extends Omit<ViewProps, 'children'> {
  /** Options affichées de gauche à droite. */
  options: SegmentOption[];
  /** Valeur sélectionnée. */
  value: string;
  /** Appelé avec la nouvelle valeur. */
  onValueChange?: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

/** Contrôle segmenté avec un indicateur qui glisse vers l'option sélectionnée. */
export function Segment({
  options,
  value,
  onValueChange,
  disabled = false,
  className,
  ...props
}: SegmentProps) {
  const { colors } = useTheme();
  const [trackWidth, setTrackWidth] = useState(0);

  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value)
  );
  const pos = useRef(new Animated.Value(selectedIndex)).current;

  useEffect(() => {
    Animated.spring(pos, {
      toValue: selectedIndex,
      useNativeDriver: false,
      friction: 9,
      tension: 120,
    }).start();
  }, [selectedIndex, pos]);

  const segmentWidth =
    options.length > 0 ? (trackWidth - PADDING * 2) / options.length : 0;

  return (
    <View
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      className={cn(
        'flex-row rounded-lg bg-muted p-1',
        disabled && 'opacity-50',
        className
      )}
      {...props}
    >
      {trackWidth > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: PADDING,
            bottom: PADDING,
            left: PADDING,
            width: segmentWidth,
            borderRadius: 6,
            backgroundColor: channelsToRgb(colors.background),
            transform: [{ translateX: Animated.multiply(pos, segmentWidth) }],
            shadowColor: '#000',
            shadowOpacity: 0.12,
            shadowRadius: 2,
            shadowOffset: { width: 0, height: 1 },
            elevation: 2,
          }}
        />
      ) : null}

      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected, disabled }}
            disabled={disabled}
            onPress={() => onValueChange?.(option.value)}
            className="flex-1 items-center justify-center py-2"
          >
            <Text
              variant="small"
              weight="medium"
              className={isSelected ? 'text-foreground' : 'text-muted-foreground'}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
