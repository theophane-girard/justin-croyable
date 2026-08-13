import { COLUMN, readRnmRows } from './rnm-parser';
import { RNM_DETAIL_MARKETS, RNM_STAGE_DETAIL } from './rnm.constants';
import { downloadRnmZip } from './rnm-source';

type DetailRow = {
  readonly market: string;
  readonly product: string;
  readonly unit: string;
};

type LabelStat = {
  count: number;
  readonly markets: Set<string>;
  readonly units: Set<string>;
};

const LABEL_COLUMN_WIDTH = 52;

function parseYear(): number {
  const raw = process.argv[2] ?? process.env['RNM_YEAR'];
  const parsed = raw ? Number.parseInt(raw, 10) : new Date().getUTCFullYear();
  return Number.isFinite(parsed) ? parsed : new Date().getUTCFullYear();
}

function parseFilter(): string {
  return (process.argv[3] ?? process.env['RNM_FILTER'] ?? '').trim().toLowerCase();
}

function toDetailRow(row: readonly string[]): DetailRow | null {
  const stage = (row[COLUMN.stage] ?? '').trim().toLowerCase();
  if (stage !== RNM_STAGE_DETAIL) {
    return null;
  }
  return {
    market: (row[COLUMN.market] ?? '').trim(),
    product: (row[COLUMN.product] ?? '').trim(),
    unit: (row[COLUMN.unit] ?? '').trim(),
  };
}

function countBy(values: readonly string[]): ReadonlyMap<string, number> {
  return values.reduce((accumulator, value) => {
    accumulator.set(value, (accumulator.get(value) ?? 0) + 1);
    return accumulator;
  }, new Map<string, number>());
}

function shortenMarket(market: string): string {
  return RNM_DETAIL_MARKETS[market] ?? market;
}

function buildLabelStats(rows: readonly DetailRow[]): ReadonlyMap<string, LabelStat> {
  return rows.reduce((accumulator, row) => {
    const stat = accumulator.get(row.product) ?? {
      count: 0,
      markets: new Set<string>(),
      units: new Set<string>(),
    };
    stat.count += 1;
    stat.markets.add(shortenMarket(row.market));
    stat.units.add(row.unit);
    accumulator.set(row.product, stat);
    return accumulator;
  }, new Map<string, LabelStat>());
}

function sortedByCountDesc<T>(entries: ReadonlyMap<string, T>, count: (value: T) => number) {
  return [...entries.entries()].sort(([, a], [, b]) => count(b) - count(a));
}

function printSection(title: string, lines: readonly string[]): void {
  console.log(`\n=== ${title} ===`);
  lines.forEach(line => console.log(line));
}

function formatLabelLine(product: string, stat: LabelStat): string {
  const count = String(stat.count).padStart(6);
  const label = product.padEnd(LABEL_COLUMN_WIDTH);
  const markets = [...stat.markets].sort().join('+');
  const units = [...stat.units].sort().join('|');
  return `${count}  ${label}  [${markets}]  {${units}}`;
}

async function inventory(): Promise<void> {
  const year = parseYear();
  const filter = parseFilter();
  console.log(`Inventaire RNM — année ${year}${filter ? ` — filtre « ${filter} »` : ''}`);

  const zip = await downloadRnmZip(year);
  const detailRows = readRnmRows(zip)
    .map(toDetailRow)
    .filter((row): row is DetailRow => row !== null);

  printSection(
    'Marchés (stade détail)',
    sortedByCountDesc(countBy(detailRows.map(row => row.market)), value => value).map(
      ([market, count]) => `${String(count).padStart(8)}  ${market}`,
    ),
  );

  printSection(
    'Unités (stade détail)',
    sortedByCountDesc(countBy(detailRows.map(row => row.unit)), value => value).map(
      ([unit, count]) => `${String(count).padStart(8)}  ${unit}`,
    ),
  );

  const labelLines = sortedByCountDesc(buildLabelStats(detailRows), stat => stat.count)
    .filter(([product]) => !filter || product.toLowerCase().includes(filter))
    .map(([product, stat]) => formatLabelLine(product, stat));

  printSection(`Libellés produit (${labelLines.length} distincts)`, labelLines);
  console.log(`\n${detailRows.length} lignes détail au total.`);
}

inventory()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Inventaire RNM échoué :', error);
    process.exit(1);
  });
