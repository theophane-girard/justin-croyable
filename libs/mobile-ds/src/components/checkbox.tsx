import { Pressable, View, type PressableProps } from 'react-native';

import { cn } from '../utils/cn';
import { Text } from './text';

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

/** Case à cocher contrôlée, avec libellé optionnel. */
export function Checkbox({
  checked,
  onCheckedChange,
  label,
  disabled = false,
  className,
  ...props
}: CheckboxProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={() => onCheckedChange?.(!checked)}
      className={cn('flex-row items-center gap-2', disabled && 'opacity-50')}
      {...props}
    >
      <View
        className={cn(
          'h-5 w-5 items-center justify-center rounded-md border',
          checked ? 'border-primary bg-primary' : 'border-input bg-background',
          className
        )}
      >
        {checked ? (
          <Text className="text-xs font-bold text-primary-foreground leading-none">
            ✓
          </Text>
        ) : null}
      </View>
      {label ? <Text variant="body">{label}</Text> : null}
    </Pressable>
  );
}
