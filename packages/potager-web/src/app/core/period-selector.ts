import { YEAR_ALL, type YearFilter } from './potager.model';

export const YEAR_ALL_LABEL = 'Toutes';

export type YearOption = { readonly value: string; readonly label: string };

export function buildYearOptions(years: readonly number[]): YearOption[] {
  return [
    ...years.map(year => ({ value: String(year), label: String(year) })),
    { value: YEAR_ALL, label: YEAR_ALL_LABEL },
  ];
}

export function yearFilterToValue(year: YearFilter): string {
  return year === YEAR_ALL ? YEAR_ALL : String(year);
}

export function yearFilterToLabel(year: YearFilter): string {
  return year === YEAR_ALL ? YEAR_ALL_LABEL : String(year);
}

export function parseYearValue(value: string | null): YearFilter | null {
  if (value === null) {
    return null;
  }
  if (value === YEAR_ALL) {
    return YEAR_ALL;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}
