import { normalizeText } from './pokemon-search';

export interface Ability {
  readonly slug: string;
  readonly label: string;
  readonly searchText: string;
}

export const ABILITIES_QUERY = `
query PokemonComparatorAbilities {
  ability(order_by: { id: asc }) {
    name
    abilitynames(where: { language: { name: { _in: ["fr", "en", "de", "roomaji"] } } }) {
      name
      language {
        name
      }
    }
  }
}`;

interface RawAbilityName {
  readonly name: string;
  readonly language: { readonly name: string };
}

interface RawAbility {
  readonly name: string;
  readonly abilitynames: readonly RawAbilityName[];
}

interface AbilitiesResponse {
  readonly data?: { readonly ability?: readonly RawAbility[] };
}

function toAbility(raw: RawAbility): Ability | undefined {
  const names = raw.abilitynames;
  if (names.length === 0) {
    return undefined;
  }
  const french = names.find(entry => entry.language.name === 'fr');
  const english = names.find(entry => entry.language.name === 'en');
  const label = french?.name ?? english?.name ?? raw.name;
  const searchText = [raw.name, ...names.map(entry => entry.name)]
    .map(normalizeText)
    .join(' ');
  return { slug: raw.name, label, searchText };
}

export function parseAbilities(value: unknown): readonly Ability[] {
  const abilities = (value as AbilitiesResponse).data?.ability;
  if (!abilities) {
    return [];
  }
  return abilities
    .map(toAbility)
    .filter((ability): ability is Ability => ability !== undefined)
    .sort((a, b) => a.label.localeCompare(b.label, 'fr'));
}
