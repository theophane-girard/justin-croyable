import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Modal as RNModal,
  Pressable,
  ScrollView,
  View,
} from 'react-native';

import { cn } from '../utils/cn';
import { Text } from './text';
import { Checkbox } from './checkbox';
import { useThemeVars } from '../theme/theme-provider';

export interface SelectOption {
  label: string;
  value: string;
}

/* -------------------------------------------------------------------------- */
/* Feuille animée partagée (slide-up + fondu, montage/démontage propres)        */
/* -------------------------------------------------------------------------- */

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

function Sheet({ visible, onClose, title, children }: SheetProps) {
  const themeVars = useThemeVars();
  const progress = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.spring(progress, {
        toValue: 1,
        useNativeDriver: false,
        friction: 9,
        tension: 90,
      }).start();
    } else if (mounted) {
      Animated.timing(progress, {
        toValue: 0,
        duration: 150,
        useNativeDriver: false,
      }).start((result) => {
        if (result?.finished) setMounted(false);
      });
    }
  }, [visible, mounted, progress]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [32, 0],
  });

  return (
    <RNModal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={themeVars} className="flex-1">
        <Animated.View style={{ flex: 1, opacity: progress }}>
          <Pressable
            className="flex-1 justify-end bg-black/50"
            onPress={onClose}
          >
            <Animated.View style={{ transform: [{ translateY }] }}>
              <Pressable
                onPress={(e) => e.stopPropagation()}
                className="max-h-[70%] rounded-t-2xl border-t border-border bg-card p-4 pb-8"
              >
                {title ? (
                  <Text variant="h4" className="mb-2 text-card-foreground">
                    {title}
                  </Text>
                ) : null}
                <ScrollView showsVerticalScrollIndicator={false}>
                  {children}
                </ScrollView>
              </Pressable>
            </Animated.View>
          </Pressable>
        </Animated.View>
      </View>
    </RNModal>
  );
}

/* -------------------------------------------------------------------------- */
/* Déclencheur partagé (champ + chevron animé)                                  */
/* -------------------------------------------------------------------------- */

interface TriggerProps {
  label?: string;
  placeholder?: string;
  display: string | null;
  open: boolean;
  disabled?: boolean;
  className?: string;
  onPress: () => void;
}

function Trigger({
  label,
  placeholder,
  display,
  open,
  disabled,
  className,
  onPress,
}: TriggerProps) {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(rotation, {
      toValue: open ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [open, rotation]);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View className={cn('gap-1.5', className)}>
      {label ? (
        <Text variant="small" weight="medium">
          {label}
        </Text>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open, disabled }}
        disabled={disabled}
        onPress={onPress}
        className={cn(
          'h-11 flex-row items-center justify-between rounded-lg border border-input bg-background px-3',
          disabled && 'opacity-50'
        )}
      >
        <Text
          variant="body"
          className={display ? 'text-foreground' : 'text-muted-foreground'}
          numberOfLines={1}
        >
          {display ?? placeholder ?? 'Sélectionner…'}
        </Text>
        <Animated.Text
          style={{ transform: [{ rotate }] }}
          className="text-muted-foreground"
        >
          ▾
        </Animated.Text>
      </Pressable>
    </View>
  );
}

function OptionRow({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      className="flex-row items-center justify-between rounded-lg px-3 py-3 active:bg-accent"
    >
      <Text
        variant="body"
        className={selected ? 'text-primary' : 'text-foreground'}
      >
        {label}
      </Text>
      {selected ? (
        <Text className="text-base font-bold text-primary">✓</Text>
      ) : null}
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/* Select (choix unique)                                                        */
/* -------------------------------------------------------------------------- */

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  /** Titre affiché en haut de la feuille. */
  sheetTitle?: string;
  disabled?: boolean;
  className?: string;
}

/** Menu déroulant à choix unique, avec feuille animée (slide-up). */
export function Select({
  options,
  value,
  onValueChange,
  placeholder,
  label,
  sheetTitle,
  disabled = false,
  className,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <>
      <Trigger
        label={label}
        placeholder={placeholder}
        display={selected?.label ?? null}
        open={open}
        disabled={disabled}
        className={className}
        onPress={() => setOpen(true)}
      />
      <Sheet visible={open} onClose={() => setOpen(false)} title={sheetTitle}>
        {options.map((option) => (
          <OptionRow
            key={option.value}
            label={option.label}
            selected={option.value === value}
            onPress={() => {
              onValueChange?.(option.value);
              setOpen(false);
            }}
          />
        ))}
      </Sheet>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* MultiSelect (choix multiple)                                                 */
/* -------------------------------------------------------------------------- */

export interface MultiSelectProps {
  options: SelectOption[];
  values: string[];
  onValuesChange?: (values: string[]) => void;
  placeholder?: string;
  label?: string;
  sheetTitle?: string;
  disabled?: boolean;
  className?: string;
}

/** Menu déroulant à choix multiple ; la feuille reste ouverte pendant la sélection. */
export function MultiSelect({
  options,
  values,
  onValuesChange,
  placeholder,
  label,
  sheetTitle,
  disabled = false,
  className,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);

  const selectedLabels = options
    .filter((o) => values.includes(o.value))
    .map((o) => o.label);
  const display =
    selectedLabels.length === 0
      ? null
      : selectedLabels.length <= 2
      ? selectedLabels.join(', ')
      : `${selectedLabels.length} sélectionnés`;

  const toggle = (value: string) => {
    if (values.includes(value)) {
      onValuesChange?.(values.filter((v) => v !== value));
    } else {
      onValuesChange?.([...values, value]);
    }
  };

  return (
    <>
      <Trigger
        label={label}
        placeholder={placeholder}
        display={display}
        open={open}
        disabled={disabled}
        className={className}
        onPress={() => setOpen(true)}
      />
      <Sheet visible={open} onClose={() => setOpen(false)} title={sheetTitle}>
        {options.map((option) => (
          <Checkbox
            key={option.value}
            checked={values.includes(option.value)}
            onCheckedChange={() => toggle(option.value)}
            label={option.label}
            containerClassName="rounded-lg px-3 py-3"
          />
        ))}
      </Sheet>
    </>
  );
}
