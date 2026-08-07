import { type BadgeTypeVariants } from '@justin-croyable/design-system';
import type { ICellRendererParams } from 'ag-grid-community';

import { CATEGORY_META, PRICE_ORIGIN, type PriceOrigin } from '../core/potager.model';

export function categoryBadgeType(params: ICellRendererParams): BadgeTypeVariants {
  return params.value === CATEGORY_META.fruit.label ? 'default' : 'secondary';
}

const PRICE_ORIGIN_BADGE: Readonly<Record<PriceOrigin, BadgeTypeVariants>> = {
  [PRICE_ORIGIN.rnm]: 'default',
  [PRICE_ORIGIN.fallback]: 'secondary',
  [PRICE_ORIGIN.reference]: 'outline',
};

export function priceOriginBadgeType(origin: PriceOrigin | undefined): BadgeTypeVariants {
  return origin ? PRICE_ORIGIN_BADGE[origin] : 'outline';
}
