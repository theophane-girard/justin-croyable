import {
  BIO_MARKET_PRIORITY,
  PRICE_MAX_PER_KG,
  PRICE_MIN_PER_KG,
  RECENT_WINDOW_DAYS,
  type RnmMarketKind,
  RNM_SUPPORTED_UNITS,
  type RnmUnit,
} from './rnm.constants';
import { type RnmObservation } from './rnm-parser';

type UnitWeightsKg = Partial<Record<RnmUnit, number>>;

type VarietyMatcher = {
  readonly slug: string;
  readonly pattern: RegExp;
  readonly exclude?: RegExp;
  readonly unitWeightsKg?: UnitWeightsKg;
};

export type ResolvedVarietyPrice = {
  readonly varietyId: string;
  readonly conventionalPricePerKg: number;
  readonly bioPricePerKg: number | null;
  readonly effectiveFrom: Date;
};

const KILOGRAMS_ONLY: UnitWeightsKg = { [RNM_SUPPORTED_UNITS.perKilogram]: 1 };

const PER_PIECE: UnitWeightsKg = { [RNM_SUPPORTED_UNITS.perPiece]: 1 };

const RADISH_KILOGRAMS_PER_BUNCH = 0.2;

const VARIETY_MATCHERS: readonly VarietyMatcher[] = [
  { slug: 'tomate-grappe', pattern: /tomate\b.*grappe/i },
  { slug: 'tomate-ronde', pattern: /tomate ronde/i, exclude: /grappe/i },
  { slug: 'tomate-cerise', pattern: /tomate cerise/i },
  { slug: 'tomate-allongee', pattern: /tomate.*allong/i, exclude: /cerise|c(?:oe|œ)ur/i },
  { slug: 'tomate-coeur-de-boeuf', pattern: /tomate.*(?:c(?:oe|œ)ur|c[ôo]tel|ancienne)/i },
  { slug: 'courgette', pattern: /courgette/i },
  { slug: 'carotte', pattern: /carotte/i },
  { slug: 'pomme-de-terre', pattern: /pomme de terre/i },
  { slug: 'poivron', pattern: /poivron/i },
  { slug: 'aubergine', pattern: /aubergine/i },
  { slug: 'oignon', pattern: /oignon/i },
  { slug: 'poireau', pattern: /poireau/i },
  { slug: 'courge', pattern: /\bcourge\b/i },
  { slug: 'salade', pattern: /laitue|salade/i, unitWeightsKg: PER_PIECE },
  { slug: 'concombre', pattern: /concombre/i, unitWeightsKg: PER_PIECE },
  {
    slug: 'radis',
    pattern: /radis/i,
    unitWeightsKg: {
      [RNM_SUPPORTED_UNITS.perKilogram]: 1,
      [RNM_SUPPORTED_UNITS.perBunch]: RADISH_KILOGRAMS_PER_BUNCH,
    },
  },
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

type PricedObservation = RnmObservation & { readonly pricePerKg: number };

type Aggregate = { readonly pricePerKg: number; readonly observedOn: Date };

function roundPrice(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function weightForUnit(matcher: VarietyMatcher, unit: RnmUnit): number | null {
  return (matcher.unitWeightsKg ?? KILOGRAMS_ONLY)[unit] ?? null;
}

function toPricedObservation(
  matcher: VarietyMatcher,
  observation: RnmObservation,
): PricedObservation | null {
  const weight = weightForUnit(matcher, observation.unit);
  if (weight === null) {
    return null;
  }
  const pricePerKg = roundPrice(observation.price / weight);
  if (pricePerKg < PRICE_MIN_PER_KG || pricePerKg > PRICE_MAX_PER_KG) {
    return null;
  }
  return { ...observation, pricePerKg };
}

function aggregate(observations: readonly PricedObservation[]): Aggregate | null {
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
  observations: readonly PricedObservation[],
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
  const matched = observations
    .filter(
      observation =>
        matcher.pattern.test(observation.product) &&
        !(matcher.exclude?.test(observation.product) ?? false),
    )
    .map(observation => toPricedObservation(matcher, observation))
    .filter((observation): observation is PricedObservation => observation !== null);
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
