import { BIO_MARKET_PRIORITY, RECENT_WINDOW_DAYS, type RnmMarketKind } from './rnm.constants';
import { type RnmObservation } from './rnm-parser';

type VarietyMatcher = {
  readonly slug: string;
  readonly pattern: RegExp;
  readonly exclude?: RegExp;
};

export type ResolvedVarietyPrice = {
  readonly varietyId: string;
  readonly conventionalPricePerKg: number;
  readonly bioPricePerKg: number | null;
  readonly effectiveFrom: Date;
};

const VARIETY_MATCHERS: readonly VarietyMatcher[] = [
  { slug: 'tomate-grappe', pattern: /tomate\b.*grappe/i },
  { slug: 'tomate-ronde', pattern: /tomate ronde/i, exclude: /grappe/i },
  { slug: 'tomate-cerise', pattern: /tomate cerise/i },
  { slug: 'tomate-allongee', pattern: /tomate.*allong/i },
  { slug: 'tomate-coeur-de-boeuf', pattern: /tomate.*c(?:oe|œ)ur/i },
  { slug: 'courgette', pattern: /courgette/i },
  { slug: 'carotte', pattern: /carotte/i },
  { slug: 'pomme-de-terre', pattern: /pomme de terre/i },
  { slug: 'poivron', pattern: /poivron/i },
  { slug: 'aubergine', pattern: /aubergine/i },
  { slug: 'oignon', pattern: /oignon/i },
  { slug: 'poireau', pattern: /poireau/i },
  { slug: 'courge', pattern: /\bcourge\b/i },
  { slug: 'fraise', pattern: /fraise/i },
  { slug: 'framboise', pattern: /framboise/i },
  { slug: 'pomme', pattern: /\bpomme\b/i, exclude: /pomme de terre/i },
  { slug: 'poire', pattern: /\bpoire\b/i },
  { slug: 'prune', pattern: /prune/i },
  { slug: 'cerise', pattern: /cerise/i, exclude: /tomate/i },
  { slug: 'abricot', pattern: /abricot/i },
  { slug: 'peche', pattern: /p[êe]che/i },
  { slug: 'raisin', pattern: /raisin/i },
];

type Aggregate = { readonly pricePerKg: number; readonly observedOn: Date };

function roundPrice(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function aggregate(observations: readonly RnmObservation[]): Aggregate | null {
  if (observations.length === 0) {
    return null;
  }
  const latest = observations.reduce(
    (max, observation) => Math.max(max, observation.observedOn.getTime()),
    0,
  );
  const windowStart = latest - RECENT_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const recent = observations.filter(
    observation => observation.observedOn.getTime() >= windowStart,
  );
  const total = recent.reduce((sum, observation) => sum + observation.pricePerKg, 0);
  return { pricePerKg: roundPrice(total / recent.length), observedOn: new Date(latest) };
}

function aggregateByPriority(
  observations: readonly RnmObservation[],
  priority: readonly RnmMarketKind[],
): Aggregate | null {
  return priority.reduce<Aggregate | null>((resolved, kind) => {
    if (resolved) {
      return resolved;
    }
    return aggregate(observations.filter(observation => observation.marketKind === kind));
  }, null);
}

function resolveMatcher(
  matcher: VarietyMatcher,
  observations: readonly RnmObservation[],
): ResolvedVarietyPrice | null {
  const matched = observations.filter(
    observation =>
      matcher.pattern.test(observation.product) &&
      !(matcher.exclude?.test(observation.product) ?? false),
  );
  const conventional = aggregate(matched.filter(observation => !observation.isOrganic));
  if (!conventional) {
    return null;
  }
  const bio = aggregateByPriority(
    matched.filter(observation => observation.isOrganic),
    BIO_MARKET_PRIORITY,
  );
  return {
    varietyId: matcher.slug,
    conventionalPricePerKg: conventional.pricePerKg,
    bioPricePerKg: bio?.pricePerKg ?? null,
    effectiveFrom: conventional.observedOn,
  };
}

export function resolvePrices(observations: readonly RnmObservation[]): ResolvedVarietyPrice[] {
  return VARIETY_MATCHERS.map(matcher => resolveMatcher(matcher, observations)).filter(
    (price): price is ResolvedVarietyPrice => price !== null,
  );
}
