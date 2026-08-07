import { type CellTagColor } from '@justin-croyable/design-system';

import { PRICE_ORIGIN, type PriceOrigin } from '../core/potager.model';

export const CATEGORY_TAG_COLOR: CellTagColor = 'neutral';

const PRICE_ORIGIN_TAG_COLOR: Readonly<Record<PriceOrigin, CellTagColor>> = {
  [PRICE_ORIGIN.rnm]: 'success',
  [PRICE_ORIGIN.fallback]: 'warning',
  [PRICE_ORIGIN.reference]: 'neutral',
};

export function priceOriginTagColor(origin: PriceOrigin | undefined): CellTagColor {
  return origin ? PRICE_ORIGIN_TAG_COLOR[origin] : 'neutral';
}
