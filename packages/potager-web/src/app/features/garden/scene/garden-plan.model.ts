import { type CropId, type VarietyId } from '../../../core/potager.model';

export const SLOT_SIZE = 0.9;
export const FIELD_COLUMNS = 6;
export const FIELD_ROWS = 5;

const SLOT_KEY_SEPARATOR = ':';
const HALF = 2;

export type BedSize = {
  readonly columns: number;
  readonly rows: number;
};

export const BED_SIZES: readonly BedSize[] = [
  { columns: 1, rows: 1 },
  { columns: 2, rows: 1 },
  { columns: 3, rows: 1 },
  { columns: 2, rows: 2 },
  { columns: 3, rows: 2 },
  { columns: 4, rows: 2 },
  { columns: 3, rows: 3 },
];

export type PlannedBed = {
  readonly id: string;
  readonly column: number;
  readonly row: number;
  readonly columns: number;
  readonly rows: number;
};

export type PlannedCell = {
  readonly bedId: string;
  readonly column: number;
  readonly row: number;
  readonly cropId: CropId;
  readonly varietyId: VarietyId;
};

export type GardenPlan = {
  readonly beds: readonly PlannedBed[];
  readonly cells: readonly PlannedCell[];
};

export const EMPTY_GARDEN_PLAN: GardenPlan = { beds: [], cells: [] };

export function slotKey(column: number, row: number): string {
  return `${column}${SLOT_KEY_SEPARATOR}${row}`;
}

export function cellKey(bedId: string, column: number, row: number): string {
  return `${bedId}${SLOT_KEY_SEPARATOR}${column}${SLOT_KEY_SEPARATOR}${row}`;
}

function bedSlotKeys(bed: PlannedBed): readonly string[] {
  return Array.from({ length: bed.columns }, (_, column) =>
    Array.from({ length: bed.rows }, (_, row) => slotKey(bed.column + column, bed.row + row)),
  ).flat();
}

export function occupiedSlotKeys(beds: readonly PlannedBed[]): ReadonlySet<string> {
  return new Set(beds.flatMap(bedSlotKeys));
}

export function fitsOnField(column: number, row: number, size: BedSize): boolean {
  return column + size.columns <= FIELD_COLUMNS && row + size.rows <= FIELD_ROWS;
}

export function canPlaceBed(
  beds: readonly PlannedBed[],
  column: number,
  row: number,
  size: BedSize,
): boolean {
  if (!fitsOnField(column, row, size)) {
    return false;
  }
  const occupied = occupiedSlotKeys(beds);
  return Array.from({ length: size.columns }).every((_, columnOffset) =>
    Array.from({ length: size.rows }).every(
      (__, rowOffset) => !occupied.has(slotKey(column + columnOffset, row + rowOffset)),
    ),
  );
}

export function availableBedSizes(
  beds: readonly PlannedBed[],
  column: number,
  row: number,
): readonly BedSize[] {
  return BED_SIZES.filter(size => canPlaceBed(beds, column, row, size));
}

export function freeSlots(beds: readonly PlannedBed[]): readonly { column: number; row: number }[] {
  const occupied = occupiedSlotKeys(beds);
  return Array.from({ length: FIELD_COLUMNS }, (_, column) =>
    Array.from({ length: FIELD_ROWS }, (_, row) => ({ column, row })),
  )
    .flat()
    .filter(slot => !occupied.has(slotKey(slot.column, slot.row)));
}

export function slotCenterX(column: number): number {
  return (column - (FIELD_COLUMNS - 1) / HALF) * SLOT_SIZE;
}

export function slotCenterZ(row: number): number {
  return (row - (FIELD_ROWS - 1) / HALF) * SLOT_SIZE;
}

export function bedCenterX(bed: PlannedBed): number {
  return slotCenterX(bed.column) + ((bed.columns - 1) * SLOT_SIZE) / HALF;
}

export function bedCenterZ(bed: PlannedBed): number {
  return slotCenterZ(bed.row) + ((bed.rows - 1) * SLOT_SIZE) / HALF;
}

export function findCell(
  cells: readonly PlannedCell[],
  bedId: string,
  column: number,
  row: number,
): PlannedCell | undefined {
  return cells.find(cell => cell.bedId === bedId && cell.column === column && cell.row === row);
}

export function bedSizeLabel(size: BedSize): string {
  return `${size.columns} × ${size.rows}`;
}
