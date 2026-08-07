import { type BadgeTypeVariants } from '@justin-croyable/design-system';

import { PRICE_ORIGIN, type PriceOrigin } from '../core/potager.model';

export const CATEGORY_TAG_PARAMS = {
  badgeType: 'secondary' as BadgeTypeVariants,
  badgeClass: 'bg-muted text-muted-foreground',
};

const PRICE_ORIGIN_BADGE: Readonly<Record<PriceOrigin, BadgeTypeVariants>> = {
  [PRICE_ORIGIN.rnm]: 'default',
  [PRICE_ORIGIN.fallback]: 'secondary',
  [PRICE_ORIGIN.reference]: 'outline',
};

export function priceOriginBadgeType(origin: PriceOrigin | undefined): BadgeTypeVariants {
  return origin ? PRICE_ORIGIN_BADGE[origin] : 'outline';
}
