export const RNM_SOURCE = 'rnm';

export const RNM_STAGE_DETAIL = 'détail';

export const RNM_SUPPORTED_UNITS = {
  perKilogram: 'le kg',
  perPiece: 'la pièce',
  perBunch: 'la botte',
} as const;

export type RnmUnit = (typeof RNM_SUPPORTED_UNITS)[keyof typeof RNM_SUPPORTED_UNITS];

export const RNM_MARKET_KIND = { gms: 'gms', specialisedBio: 'specialised-bio' } as const;

export type RnmMarketKind = (typeof RNM_MARKET_KIND)[keyof typeof RNM_MARKET_KIND];

export const RNM_DETAIL_MARKETS: Readonly<Record<string, RnmMarketKind>> = {
  'Fruits France DETAIL GMS': RNM_MARKET_KIND.gms,
  'Légumes France DETAIL GMS': RNM_MARKET_KIND.gms,
  'Fruits France DETAIL MAG. SPECIALISES BIO': RNM_MARKET_KIND.specialisedBio,
  'Légumes France DETAIL MAG. SPECIALISES BIO': RNM_MARKET_KIND.specialisedBio,
};

export const BIO_MARKET_PRIORITY: readonly RnmMarketKind[] = [
  RNM_MARKET_KIND.specialisedBio,
  RNM_MARKET_KIND.gms,
];

export const PRICE_MIN_PER_KG = 0.2;
export const PRICE_MAX_PER_KG = 40;

export const RECENT_WINDOW_DAYS = 14;

export const MIN_EXPECTED_DETAIL_ROWS = 200;

export const VISIONET_BASE_URL = 'https://visionet.franceagrimer.fr';

export const VISIONET_FILE_PATH =
  'Statistiques/multi-filieres/cotations des produits frais';

export const DOWNLOAD_USER_AGENT = 'Mozilla/5.0 (compatible; MonPotager/1.0)';

export const DOWNLOAD_MAX_ATTEMPTS = 4;
export const DOWNLOAD_RETRY_DELAY_MS = 1500;
