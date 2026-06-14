import { forwardRef } from 'react';
import {
  TextInput,
  View,
  type TextInputProps,
  type TextInput as TextInputType,
} from 'react-native';

import { cn } from '../utils/cn';
import { Text } from './text';
import { useTheme } from '../theme/theme-provider';

export interface InputProps extends TextInputProps {
  className?: string;
  /** Libellé affiché au-dessus du champ. */
  label?: string;
  /** Message d'erreur ; passe le champ en style destructif. */
  error?: string;
  /** Texte d'aide affiché sous le champ. */
  hint?: string;
  /** Conteneur englobant (label + champ + message). */
  containerClassName?: string;
}

/** Champ de saisie texte avec label, état d'erreur et aide. */
export const Input = forwardRef<TextInputType, InputProps>(function Input(
  { className, label, error, hint, containerClassName, ...props },
  ref
) {
  const { colors } = useTheme();
  const hasError = !!error;

  return (
    <View className={cn('gap-1.5', containerClassName)}>
      {label ? (
        <Text variant="small" weight="medium">
          {label}
        </Text>
      ) : null}
      <TextInput
        ref={ref}
        placeholderTextColor={`rgb(${colors.mutedForeground})`}
        className={cn(
          'h-11 rounded-lg border border-input bg-background px-3 text-base text-foreground',
          hasError && 'border-destructive',
          className
        )}
        {...props}
      />
      {error ? (
        <Text variant="caption" tone="destructive">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" tone="muted">
          {hint}
        </Text>
      ) : null}
    </View>
  );
});
