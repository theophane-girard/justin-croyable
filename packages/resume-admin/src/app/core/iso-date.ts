const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_INDEX_OFFSET = 1;
const PAD_LENGTH = 2;
const PAD_CHARACTER = '0';

function pad(value: number): string {
  return String(value).padStart(PAD_LENGTH, PAD_CHARACTER);
}

export function toIsoDate(date: Date | null): string | null {
  if (!date) {
    return null;
  }
  return `${date.getFullYear()}-${pad(date.getMonth() + MONTH_INDEX_OFFSET)}-${pad(date.getDate())}`;
}

export function fromIsoDate(value: string | null): Date | null {
  if (!value || !ISO_DATE_PATTERN.test(value)) {
    return null;
  }
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - MONTH_INDEX_OFFSET, day);
}

export function blankToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}
