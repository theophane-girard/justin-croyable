import { computed, type Signal } from '@angular/core';
import type { Field } from '@angular/forms/signals';

const DEFAULT_ERROR_MESSAGES: Record<string, string> = {
  required: 'Ce champ est requis.',
  email: 'Adresse e-mail invalide.',
  min: 'Valeur trop petite.',
  max: 'Valeur trop grande.',
  minLength: 'Valeur trop courte.',
  maxLength: 'Valeur trop longue.',
  pattern: 'Format invalide.',
};

export type FieldMessage = {
  readonly showError: Signal<boolean>;
  readonly errorMessage: Signal<string>;
};

export function fieldMessage(field: Signal<Field<unknown> | undefined>): FieldMessage {
  const state = computed(() => field()?.());

  const showError = computed(() => {
    const current = state();
    return !!current && current.invalid() && current.touched();
  });

  const errorMessage = computed(() => {
    const current = state();
    if (!showError() || !current) {
      return '';
    }
    const [firstError] = current.errors();
    if (!firstError) {
      return '';
    }
    return firstError.message ?? DEFAULT_ERROR_MESSAGES[firstError.kind] ?? 'Valeur invalide.';
  });

  return { showError, errorMessage };
}

export function fieldLabelClasses(): string {
  return 'flex w-fit items-center gap-1 text-sm leading-none font-medium select-none';
}

export function fieldMessageClasses(isError: boolean): string {
  return isError ? 'text-sm text-destructive' : 'text-sm text-muted-foreground';
}
