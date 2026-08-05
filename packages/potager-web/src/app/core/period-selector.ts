import { YEAR_ALL, type YearFilter } from './potager.model';

export type YearOption = { readonly value: string; readonly label: string };

export function buildYearOptions(years: readonly number[]): YearOption[] {
  return years.map(year => ({ value: String(year), label: String(year) }));
}

export function yearFilterToValue(year: YearFilter): string {
  return year === YEAR_ALL ? YEAR_ALL : String(year);
}

export function yearFilterToLabel(year: YearFilter): string {
  return year === YEAR_ALL ? '' : String(year);
}

export function parseYearValue(value: string | null): YearFilter | null {
  if (value === null || value === YEAR_ALL) {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}
