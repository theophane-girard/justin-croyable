import { Pressable, View, type PressableProps } from 'react-native';

import { cn } from '../utils/cn';

export interface SwitchProps
  extends Omit<PressableProps, 'onPress' | 'children'> {
  /** État du switch. */
  value: boolean;
  /** Appelé avec la nouvelle valeur lors d'un appui. */
  onValueChange?: (value: boolean) => void;
  className?: string;
  disabled?: boolean;
}

/** Interrupteur on/off contrôlé, stylé via les tokens du thème. */
export function Switch({
  value,
  onValueChange,
  disabled = false,
  className,
  ...props
}: SwitchProps) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => onValueChange?.(!value)}
      className={cn(
        'h-7 w-12 justify-center rounded-full px-0.5',
        value ? 'bg-primary' : 'bg-input',
        disabled && 'opacity-50',
        className
      )}
      {...props}
    >
      <View
        className={cn(
          'h-6 w-6 rounded-full bg-background shadow',
          value ? 'self-end' : 'self-start'
        )}
      />
    </Pressable>
  );
}
