import { parse } from 'csv-parse/sync';
import { unzipSync } from 'fflate';
import iconv from 'iconv-lite';

import {
  PRICE_MAX_PER_KG,
  PRICE_MIN_PER_KG,
  RNM_DETAIL_MARKETS,
  type RnmMarketKind,
  RNM_STAGE_DETAIL,
  RNM_SUPPORTED_UNITS,
  type RnmUnit,
} from './rnm.constants';

export type RnmObservation = {
  readonly product: string;
  readonly marketKind: RnmMarketKind;
  readonly isOrganic: boolean;
  readonly unit: RnmUnit;
  readonly price: number;
  readonly observedOn: Date;
};

const SUPPORTED_UNIT_VALUES: readonly RnmUnit[] = Object.values(RNM_SUPPORTED_UNITS);

function toSupportedUnit(raw: string): RnmUnit | null {
  return SUPPORTED_UNIT_VALUES.find(unit => unit === raw) ?? null;
}

export const COLUMN = {
  date: 0,
  week: 1,
  market: 2,
  stage: 3,
  productCode: 4,
  product: 5,
  value: 6,
  unit: 7,
} as const;

const ORGANIC_LABEL = 'biologique';

function extractCsvBytes(zip: Uint8Array): Uint8Array {
  const files = unzipSync(zip);
  const name = Object.keys(files).find(entry => entry.toLowerCase().endsWith('.csv'));
  if (!name) {
    throw new Error('Archive RNM : aucun fichier CSV trouvé.');
  }
  const content = files[name];
  if (!content) {
    throw new Error('Archive RNM : fichier CSV vide.');
  }
  return content;
}

function parsePrice(raw: string): number | null {
  const parsed = Number.parseFloat(raw.replace(',', '.'));
  if (!Number.isFinite(parsed) || parsed < PRICE_MIN_PER_KG || parsed > PRICE_MAX_PER_KG) {
    return null;
  }
  return parsed;
}

function parseFrenchDate(raw: string): Date | null {
  const parts = raw.split('/');
  if (parts.length !== 3) {
    return null;
  }
  const [day, month, year] = parts.map(part => Number.parseInt(part, 10));
  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) {
    return null;
  }
  const date = new Date(Date.UTC(year, month - 1, day));
  return Number.isNaN(date.getTime()) ? null : date;
}

function toObservation(row: readonly string[]): RnmObservation | null {
  const market = (row[COLUMN.market] ?? '').trim();
  const marketKind = RNM_DETAIL_MARKETS[market];
  if (!marketKind) {
    return null;
  }
  if ((row[COLUMN.stage] ?? '').trim().toLowerCase() !== RNM_STAGE_DETAIL) {
    return null;
  }
  const unit = toSupportedUnit((row[COLUMN.unit] ?? '').trim());
  if (unit === null) {
    return null;
  }
  const price = parsePrice((row[COLUMN.value] ?? '').trim());
  const observedOn = parseFrenchDate((row[COLUMN.date] ?? '').trim());
  if (price === null || observedOn === null) {
    return null;
  }
  const product = (row[COLUMN.product] ?? '').trim();
  const isOrganic =
    marketKind !== 'gms' || product.toLowerCase().includes(ORGANIC_LABEL);
  return { product, marketKind, isOrganic, unit, price, observedOn };
}

export function readRnmRows(zip: Uint8Array): string[][] {
  const csvText = iconv.decode(Buffer.from(extractCsvBytes(zip)), 'ISO-8859-1');
  return parse(csvText, {
    delimiter: ';',
    quote: false,
    from_line: 2,
    relax_column_count: true,
    skip_empty_lines: true,
  }) as string[][];
}

export function parseRnmCsv(zip: Uint8Array): RnmObservation[] {
  return readRnmRows(zip)
    .map(row => toObservation(row))
    .filter((observation): observation is RnmObservation => observation !== null);
}
