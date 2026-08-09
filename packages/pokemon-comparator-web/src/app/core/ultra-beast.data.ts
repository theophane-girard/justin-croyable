const ULTRA_BEAST_SPECIES_ID_BY_NAME = {
  zeroid: 793,
  mouscoto: 794,
  cancrelove: 795,
  cablifere: 796,
  bamboiselle: 797,
  katagami: 798,
  engloutyran: 799,
  vemini: 803,
  ekaiser: 804,
  megalopole: 805,
  pierroteknik: 806,
} as const;

export const ULTRA_BEAST_SPECIES_IDS: ReadonlySet<number> = new Set<number>(
  Object.values(ULTRA_BEAST_SPECIES_ID_BY_NAME),
);
