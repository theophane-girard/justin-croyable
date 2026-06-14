import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { Animated, Pressable, View } from 'react-native';

import { cn } from '../utils/cn';
import { Text } from './text';
import { useTheme } from '../theme/theme-provider';
import { channelsToRgb } from '../utils/color';

interface RadioGroupContextValue {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

export interface RadioGroupProps {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}

/** Groupe de boutons radio (sélection unique). */
export function RadioGroup({
  value,
  onValueChange,
  disabled = false,
  className,
  children,
}: RadioGroupProps) {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange, disabled }}>
      <View
        accessibilityRole="radiogroup"
        className={cn('gap-3', className)}
      >
        {children}
      </View>
    </RadioGroupContext.Provider>
  );
}

export interface RadioProps {
  /** Valeur de ce bouton. */
  value: string;
  /** Libellé affiché à droite. */
  label?: string;
  disabled?: boolean;
  className?: string;
}

/** Bouton radio animé (le point apparaît en pop, la bordure transitionne). */
export function Radio({ value, label, disabled, className }: RadioProps) {
  const ctx = useContext(RadioGroupContext);
  if (!ctx) {
    throw new Error('Radio doit être utilisé dans un <RadioGroup>.');
  }
  const { colors } = useTheme();
  const selected = ctx.value === value;
  const isDisabled = disabled || ctx.disabled;

  const progress = useRef(new Animated.Value(selected ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(progress, {
      toValue: selected ? 1 : 0,
      useNativeDriver: false,
      friction: 7,
      tension: 140,
    }).start();
  }, [selected, progress]);

  const borderColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [channelsToRgb(colors.input), channelsToRgb(colors.primary)],
  });

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled: isDisabled }}
      disabled={isDisabled}
      onPress={() => ctx.onValueChange?.(value)}
      className={cn(
        'flex-row items-center gap-2',
        isDisabled && 'opacity-50',
        className
      )}
    >
      <Animated.View
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          borderWidth: 2,
          alignItems: 'center',
          justifyContent: 'center',
          borderColor,
        }}
      >
        <Animated.View
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: channelsToRgb(colors.primary),
            opacity: progress,
            transform: [{ scale: progress }],
          }}
        />
      </Animated.View>
      {label ? <Text variant="body">{label}</Text> : null}
    </Pressable>
  );
}
