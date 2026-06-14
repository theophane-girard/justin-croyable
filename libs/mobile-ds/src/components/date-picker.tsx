import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { CaretLeft, CaretRight, CalendarBlank } from 'phosphor-react-native';

import { cn } from '../utils/cn';
import { Text } from './text';
import { BottomSheet } from './bottom-sheet';
import { IconButton } from './icon-button';
import { useTheme } from '../theme/theme-provider';
import { channelsToRgb } from '../utils/color';

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
const WEEKDAYS = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];

/** Décalage du 1er du mois, semaine commençant le lundi (0 = lundi). */
function startOffset(year: number, month: number): number {
  return (new Date(year, month, 1).getDay() + 6) % 7;
}
function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}
function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date) => void;
  label?: string;
  placeholder?: string;
  /** Date minimale sélectionnable (incluse). */
  minDate?: Date;
  /** Date maximale sélectionnable (incluse). */
  maxDate?: Date;
  disabled?: boolean;
  className?: string;
}

/** Sélecteur de date : champ + calendrier mensuel animé (BottomSheet). */
export function DatePicker({
  value,
  onChange,
  label,
  placeholder = 'Choisir une date',
  minDate,
  maxDate,
  disabled = false,
  className,
}: DatePickerProps) {
  const { colors } = useTheme();
  const today = new Date();
  const [open, setOpen] = useState(false);
  const initial = value ?? today;
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const goPrev = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };
  const goNext = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const offset = startOffset(viewYear, viewMonth);
  const total = daysInMonth(viewYear, viewMonth);
  const cells: (number | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: total }, (_, i) => i + 1),
  ];

  const isDisabledDay = (day: number) => {
    const t = startOfDay(new Date(viewYear, viewMonth, day));
    if (minDate && t < startOfDay(minDate)) return true;
    if (maxDate && t > startOfDay(maxDate)) return true;
    return false;
  };

  const select = (day: number) => {
    onChange?.(new Date(viewYear, viewMonth, day));
    setOpen(false);
  };

  const formatted = value
    ? `${String(value.getDate()).padStart(2, '0')}/${String(
        value.getMonth() + 1
      ).padStart(2, '0')}/${value.getFullYear()}`
    : null;

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
        onPress={() => setOpen(true)}
        className={cn(
          'h-11 flex-row items-center justify-between rounded-lg border border-input bg-background px-3',
          disabled && 'opacity-50'
        )}
      >
        <Text
          variant="body"
          className={formatted ? 'text-foreground' : 'text-muted-foreground'}
        >
          {formatted ?? placeholder}
        </Text>
        <CalendarBlank size={18} color={channelsToRgb(colors.mutedForeground)} />
      </Pressable>

      <BottomSheet visible={open} onClose={() => setOpen(false)} showHandle>
        <View className="px-2 pb-2">
          {/* En-tête : navigation mois */}
          <View className="mb-2 flex-row items-center justify-between">
            <IconButton
              icon={CaretLeft}
              accessibilityLabel="Mois précédent"
              onPress={goPrev}
            />
            <Text variant="body" weight="semibold">
              {MONTHS[viewMonth]} {viewYear}
            </Text>
            <IconButton
              icon={CaretRight}
              accessibilityLabel="Mois suivant"
              onPress={goNext}
            />
          </View>

          {/* Jours de la semaine */}
          <View className="flex-row">
            {WEEKDAYS.map((wd) => (
              <View key={wd} style={{ width: `${100 / 7}%` }} className="items-center py-1">
                <Text variant="caption" tone="muted">
                  {wd}
                </Text>
              </View>
            ))}
          </View>

          {/* Grille des jours */}
          <View className="flex-row flex-wrap">
            {cells.map((day, index) => {
              if (day === null) {
                return (
                  <View
                    key={`blank-${index}`}
                    style={{ width: `${100 / 7}%`, aspectRatio: 1 }}
                  />
                );
              }
              const date = new Date(viewYear, viewMonth, day);
              const selected = value ? isSameDay(date, value) : false;
              const isToday = isSameDay(date, today);
              const dayDisabled = isDisabledDay(day);

              return (
                <View
                  key={day}
                  style={{ width: `${100 / 7}%`, aspectRatio: 1 }}
                  className="p-1"
                >
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ selected: selected, disabled: dayDisabled }}
                    disabled={dayDisabled}
                    onPress={() => select(day)}
                    className={cn(
                      'flex-1 items-center justify-center rounded-full',
                      selected && 'bg-primary',
                      !selected && isToday && 'border border-primary',
                      dayDisabled && 'opacity-30'
                    )}
                  >
                    <Text
                      variant="small"
                      className={
                        selected ? 'text-primary-foreground' : 'text-foreground'
                      }
                    >
                      {day}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>
      </BottomSheet>
    </View>
  );
}
