import { type CropId, type VarietyId } from '../../../core/potager.model';

export const PARCEL_KIND = {
  ground: 'ground',
  raised: 'raised',
} as const;

export type ParcelKind = (typeof PARCEL_KIND)[keyof typeof PARCEL_KIND];

export const DEFAULT_CELL_CM = 10;
export const DEFAULT_PARCEL_LENGTH_CM = 200;
export const DEFAULT_PARCEL_WIDTH_CM = 120;

export const MIN_SIDE_CM = 20;
export const MAX_SIDE_CM = 3000;
export const MIN_CELL_CM = 5;
export const MAX_CELL_CM = 200;

export const PLACEMENT_STEP_CM = 25;
export const PLACEMENT_GAP_CM = 50;

/**
 * Le plateau de travail ne bouge plus pendant l'étape de positionnement : un
 * terrain démesuré, une trame dessinée sur une portion utile et un cadrage
 * caméra figé. C'est ce qui permet de zoomer puis de déplacer une parcelle sans
 * voir le cadrage se réinitialiser ; le terrain est ramené à l'emprise réelle à
 * la validation.
 */
export const EDITOR_TERRAIN_CM = 6000;
export const EDITOR_GRID_CM = 2400;
export const EDITOR_VIEW_CM = 1100;
export const ALIGN_TOLERANCE_CM = 8;

const CENTIMETRES_PER_METRE = 100;
const HALF = 2;

export type Parcel = {
  readonly id: string;
  readonly name: string;
  readonly lengthCm: number;
  readonly widthCm: number;
  readonly cellLengthCm: number;
  readonly cellWidthCm: number;
  readonly kind: ParcelKind;
};

export type ParcelPlacement = {
  readonly parcelId: string;
  readonly xCm: number;
  readonly zCm: number;
  readonly rotated: boolean;
};

export type Planting = {
  readonly parcelId: string;
  readonly column: number;
  readonly row: number;
  readonly cropId: CropId;
  readonly varietyId: VarietyId;
  readonly harvestedKg: number;
};

export type Tree = {
  readonly id: string;
  readonly cropId: CropId;
  readonly varietyId: VarietyId;
  readonly xCm: number;
  readonly zCm: number;
  readonly harvestedKg: number;
};

export type GardenPlan = {
  readonly parcels: readonly Parcel[];
  readonly placements: readonly ParcelPlacement[];
  readonly plantings: readonly Planting[];
  readonly trees: readonly Tree[];
};

export const EMPTY_GARDEN_PLAN: GardenPlan = {
  parcels: [],
  placements: [],
  plantings: [],
  trees: [],
};

export type ParcelFootprint = {
  readonly widthCm: number;
  readonly depthCm: number;
  readonly columns: number;
  readonly rows: number;
  readonly cellWidthCm: number;
  readonly cellDepthCm: number;
};

export type PlacedRect = {
  readonly xCm: number;
  readonly zCm: number;
  readonly widthCm: number;
  readonly depthCm: number;
};

export type CellCoordinate = {
  readonly column: number;
  readonly row: number;
};

export type CellTarget = CellCoordinate & {
  readonly parcelId: string;
};

export const SOW_PATTERN = {
  all: 'all',
  everyOther: 'everyOther',
  gaps: 'gaps',
} as const;

export type SowPattern = (typeof SOW_PATTERN)[keyof typeof SOW_PATTERN];

export type SowOptions = {
  readonly pattern: SowPattern;
  readonly startSown: boolean;
};

export const DEFAULT_SOW_OPTIONS: SowOptions = {
  pattern: SOW_PATTERN.all,
  startSown: true,
};

export const SOW_MODE = {
  single: 'single',
  parcel: 'parcel',
  row: 'row',
  column: 'column',
} as const;

export type SowMode = (typeof SOW_MODE)[keyof typeof SOW_MODE];

export function metres(centimetres: number): number {
  return centimetres / CENTIMETRES_PER_METRE;
}

export function formatMetres(centimetres: number): string {
  return `${metres(centimetres).toFixed(2).replace('.', ',')} m`;
}

export function formatCentimetres(centimetres: number): string {
  return `${Math.round(centimetres)} cm`;
}

export function snapToStep(centimetres: number): number {
  return Math.round(centimetres / PLACEMENT_STEP_CM) * PLACEMENT_STEP_CM;
}

/**
 * Une rotation d'un quart de tour échange l'axe des largeurs et celui des
 * longueurs, pour l'emprise comme pour la taille des cases.
 */
export function parcelFootprint(parcel: Parcel, rotated: boolean): ParcelFootprint {
  const widthCm = rotated ? parcel.lengthCm : parcel.widthCm;
  const depthCm = rotated ? parcel.widthCm : parcel.lengthCm;
  const cellWidthCm = rotated ? parcel.cellLengthCm : parcel.cellWidthCm;
  const cellDepthCm = rotated ? parcel.cellWidthCm : parcel.cellLengthCm;
  return {
    widthCm,
    depthCm,
    cellWidthCm,
    cellDepthCm,
    columns: Math.max(1, Math.floor(widthCm / cellWidthCm)),
    rows: Math.max(1, Math.floor(depthCm / cellDepthCm)),
  };
}

export function parcelCellCount(parcel: Parcel): number {
  const footprint = parcelFootprint(parcel, false);
  return footprint.columns * footprint.rows;
}

export function gridLabel(footprint: ParcelFootprint): string {
  return `${footprint.columns} × ${footprint.rows} cases`;
}

export function surfaceLabel(footprint: ParcelFootprint): string {
  return `${formatMetres(footprint.widthCm)} × ${formatMetres(footprint.depthCm)}`;
}

export function cellCentreX(footprint: ParcelFootprint, column: number): number {
  return (column - (footprint.columns - 1) / HALF) * footprint.cellWidthCm;
}

export function cellCentreZ(footprint: ParcelFootprint, row: number): number {
  return (row - (footprint.rows - 1) / HALF) * footprint.cellDepthCm;
}

export function placementRect(parcel: Parcel, placement: ParcelPlacement): PlacedRect {
  const footprint = parcelFootprint(parcel, placement.rotated);
  return {
    xCm: placement.xCm,
    zCm: placement.zCm,
    widthCm: footprint.widthCm,
    depthCm: footprint.depthCm,
  };
}

function rectsOverlap(a: PlacedRect, b: PlacedRect): boolean {
  return (
    a.xCm < b.xCm + b.widthCm &&
    b.xCm < a.xCm + a.widthCm &&
    a.zCm < b.zCm + b.depthCm &&
    b.zCm < a.zCm + a.depthCm
  );
}

export function overlappingParcelIds(
  parcels: readonly Parcel[],
  placements: readonly ParcelPlacement[],
): ReadonlySet<string> {
  const rects = placements
    .map(placement => {
      const parcel = parcels.find(candidate => candidate.id === placement.parcelId);
      return parcel
        ? ({
            parcel,
            placement,
            rect: placementRect(parcel, placement),
          } as const)
        : null;
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  return new Set(
    rects
      .filter(entry => rects.some(other => other !== entry && rectsOverlap(entry.rect, other.rect)))
      .map(entry => entry.placement.parcelId),
  );
}

export function placementBounds(
  parcels: readonly Parcel[],
  placements: readonly ParcelPlacement[],
): PlacedRect {
  const rects = placements
    .map(placement => {
      const parcel = parcels.find(candidate => candidate.id === placement.parcelId);
      return parcel ? placementRect(parcel, placement) : null;
    })
    .filter((rect): rect is PlacedRect => rect !== null);

  if (rects.length === 0) {
    return { xCm: 0, zCm: 0, widthCm: 0, depthCm: 0 };
  }

  const minX = Math.min(...rects.map(rect => rect.xCm));
  const minZ = Math.min(...rects.map(rect => rect.zCm));
  const maxX = Math.max(...rects.map(rect => rect.xCm + rect.widthCm));
  const maxZ = Math.max(...rects.map(rect => rect.zCm + rect.depthCm));
  return { xCm: minX, zCm: minZ, widthCm: maxX - minX, depthCm: maxZ - minZ };
}

export type PlanExtent = {
  readonly widthCm: number;
  readonly depthCm: number;
};

export const EDITOR_EXTENT: PlanExtent = {
  widthCm: EDITOR_TERRAIN_CM,
  depthCm: EDITOR_TERRAIN_CM,
};

export const EDITOR_VIEW_EXTENT: PlanExtent = {
  widthCm: EDITOR_VIEW_CM,
  depthCm: EDITOR_VIEW_CM,
};

export const ALIGN_AXIS = { x: 'x', z: 'z' } as const;

export type AlignAxis = (typeof ALIGN_AXIS)[keyof typeof ALIGN_AXIS];

export type AlignmentGuide = {
  readonly axis: AlignAxis;
  readonly valueCm: number;
};

export type SnappedPlacement = {
  readonly xCm: number;
  readonly zCm: number;
  readonly guides: readonly AlignmentGuide[];
};

type AxisSnap = {
  readonly value: number;
  readonly guide: number | null;
};

const ANCHOR_KIND = { edge: 'edge', middle: 'middle' } as const;

type AnchorKind = (typeof ANCHOR_KIND)[keyof typeof ANCHOR_KIND];

type Anchor = {
  readonly value: number;
  readonly kind: AnchorKind;
};

function anchorsOf(start: number, size: number): readonly Anchor[] {
  return [
    { value: start, kind: ANCHOR_KIND.edge },
    { value: start + size / HALF, kind: ANCHOR_KIND.middle },
    { value: start + size, kind: ANCHOR_KIND.edge },
  ];
}

/**
 * Aimante la parcelle déplacée sur ses voisines. Seuls les repères de même
 * nature s'attirent — un bord sur un bord, un milieu sur un milieu : apparier
 * un bord avec un milieu produisait des alignements que personne ne cherche, et
 * comme il y en a neuf par voisine, quelque chose accrochait toujours. À défaut
 * de voisine assez proche, la position retombe sur le quadrillage du plateau.
 */
function snapAxis(start: number, size: number, targets: readonly Anchor[]): AxisSnap {
  const closest = anchorsOf(start, size)
    .flatMap(anchor =>
      targets
        .filter(target => target.kind === anchor.kind)
        .map(target => ({ delta: target.value - anchor.value, target: target.value })),
    )
    .reduce<{ delta: number; target: number } | null>(
      (best, candidate) =>
        Math.abs(candidate.delta) <= ALIGN_TOLERANCE_CM &&
        (best === null || Math.abs(candidate.delta) < Math.abs(best.delta))
          ? candidate
          : best,
      null,
    );
  if (closest === null) {
    return { value: snapToStep(start), guide: null };
  }
  return { value: start + closest.delta, guide: closest.target };
}

function axisTargets(rects: readonly PlacedRect[], axis: AlignAxis): readonly Anchor[] {
  return rects.flatMap(rect =>
    anchorsOf(
      axis === ALIGN_AXIS.x ? rect.xCm : rect.zCm,
      axis === ALIGN_AXIS.x ? rect.widthCm : rect.depthCm,
    ),
  );
}

export function snapPlacement(
  moving: { readonly widthCm: number; readonly depthCm: number },
  desiredXCm: number,
  desiredZCm: number,
  neighbours: readonly PlacedRect[],
): SnappedPlacement {
  const horizontal = snapAxis(desiredXCm, moving.widthCm, axisTargets(neighbours, ALIGN_AXIS.x));
  const vertical = snapAxis(desiredZCm, moving.depthCm, axisTargets(neighbours, ALIGN_AXIS.z));
  return {
    xCm: horizontal.value,
    zCm: vertical.value,
    guides: [
      ...(horizontal.guide === null
        ? []
        : [{ axis: ALIGN_AXIS.x, valueCm: horizontal.guide } as const]),
      ...(vertical.guide === null
        ? []
        : [{ axis: ALIGN_AXIS.z, valueCm: vertical.guide } as const]),
    ],
  };
}

export function neighbourRects(
  parcels: readonly Parcel[],
  placements: readonly ParcelPlacement[],
  excludedId: string,
): readonly PlacedRect[] {
  return placements
    .filter(placement => placement.parcelId !== excludedId)
    .flatMap(placement => {
      const parcel = parcels.find(candidate => candidate.id === placement.parcelId);
      return parcel ? [placementRect(parcel, placement)] : [];
    });
}

/**
 * Ramène les parcelles autour de l'origine : c'est ce qui « réduit la grille
 * pour tenir dans le rendu final » à la validation de l'étape 2.
 */
export function centrePlacements(
  parcels: readonly Parcel[],
  placements: readonly ParcelPlacement[],
): readonly ParcelPlacement[] {
  const bounds = placementBounds(parcels, placements);
  const offsetX = bounds.xCm + bounds.widthCm / HALF;
  const offsetZ = bounds.zCm + bounds.depthCm / HALF;
  return placements.map(placement => ({
    ...placement,
    xCm: snapToStep(placement.xCm - offsetX),
    zCm: snapToStep(placement.zCm - offsetZ),
  }));
}

/** Dispose les parcelles en ligne, séparées d'un léger espacement. */
export function spreadPlacements(parcels: readonly Parcel[]): readonly ParcelPlacement[] {
  const laid = parcels.reduce<{
    placements: ParcelPlacement[];
    cursorX: number;
  }>(
    (accumulator, parcel) => {
      const footprint = parcelFootprint(parcel, false);
      accumulator.placements.push({
        parcelId: parcel.id,
        xCm: snapToStep(accumulator.cursorX),
        zCm: snapToStep(-footprint.depthCm / HALF),
        rotated: false,
      });
      return {
        placements: accumulator.placements,
        cursorX: accumulator.cursorX + footprint.widthCm + PLACEMENT_GAP_CM,
      };
    },
    { placements: [], cursorX: 0 },
  );
  return centrePlacements(parcels, laid.placements);
}

export function sowTargets(
  footprint: ParcelFootprint,
  mode: SowMode,
  origin: CellCoordinate,
): readonly CellCoordinate[] {
  const columns = Array.from({ length: footprint.columns }, (_, column) => column);
  const rows = Array.from({ length: footprint.rows }, (_, row) => row);

  if (mode === SOW_MODE.parcel) {
    return columns.flatMap(column => rows.map(row => ({ column, row })));
  }
  if (mode === SOW_MODE.row) {
    return columns.map(column => ({ column, row: origin.row }));
  }
  if (mode === SOW_MODE.column) {
    return rows.map(row => ({ column: origin.column, row }));
  }
  return [origin];
}

const ALTERNATE_PERIOD = 2;

/**
 * Découpe une étendue en une case sur deux : le long de la ligne pour un semis
 * de ligne, de la colonne pour une colonne, en damier pour une parcelle
 * entière. `startSown` décide si la première case du rang est semée ou laissée
 * libre.
 */
export function alternateTargets(
  mode: SowMode,
  targets: readonly CellCoordinate[],
  startSown: boolean,
): readonly CellCoordinate[] {
  const expected = startSown ? 0 : 1;
  return targets.filter(cell => alternateIndex(mode, cell) % ALTERNATE_PERIOD === expected);
}

function alternateIndex(mode: SowMode, cell: CellCoordinate): number {
  if (mode === SOW_MODE.row) {
    return cell.column;
  }
  if (mode === SOW_MODE.column) {
    return cell.row;
  }
  return cell.column + cell.row;
}

export function findPlanting(
  plantings: readonly Planting[],
  parcelId: string,
  column: number,
  row: number,
): Planting | undefined {
  return plantings.find(
    planting =>
      planting.parcelId === parcelId && planting.column === column && planting.row === row,
  );
}

/**
 * Conserve la position des parcelles déjà posées et dépose les nouvelles à
 * droite de l'emprise courante. Au premier passage, tout est étalé en ligne.
 */
export function reconcilePlacements(
  parcels: readonly Parcel[],
  existing: readonly ParcelPlacement[],
): readonly ParcelPlacement[] {
  if (existing.length === 0) {
    return spreadPlacements(parcels);
  }

  const known = new Map(existing.map(placement => [placement.parcelId, placement] as const));
  const kept = parcels.flatMap(parcel => {
    const placement = known.get(parcel.id);
    return placement ? [placement] : [];
  });
  const missing = parcels.filter(parcel => !known.has(parcel.id));
  if (missing.length === 0) {
    return kept;
  }

  const bounds = placementBounds(parcels, kept);
  const appended = missing.reduce<{
    placements: ParcelPlacement[];
    cursorX: number;
  }>(
    (accumulator, parcel) => {
      const footprint = parcelFootprint(parcel, false);
      accumulator.placements.push({
        parcelId: parcel.id,
        xCm: snapToStep(accumulator.cursorX),
        zCm: snapToStep(bounds.zCm),
        rotated: false,
      });
      return {
        placements: accumulator.placements,
        cursorX: accumulator.cursorX + footprint.widthCm + PLACEMENT_GAP_CM,
      };
    },
    { placements: [], cursorX: bounds.xCm + bounds.widthCm + PLACEMENT_GAP_CM },
  );

  return [...kept, ...appended.placements];
}
