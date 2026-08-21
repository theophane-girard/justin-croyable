import { isPlatformBrowser } from '@angular/common';
import { computed, DOCUMENT, inject, Injectable, PLATFORM_ID } from '@angular/core';
import { ThemeService } from '@justin-croyable/design-system';

import { oklchToHex, type OklchColor, parseOklch, scaleOklch } from './oklch-color';

export const SCENE_COLOR = {
  fieldSoil: 'fieldSoil',
  fieldFurrow: 'fieldFurrow',
  grass: 'grass',
  bedSoil: 'bedSoil',
  bedFurrow: 'bedFurrow',
  wood: 'wood',
  woodDark: 'woodDark',
  stone: 'stone',
  leafDeep: 'leafDeep',
  leaf: 'leaf',
  leafBright: 'leafBright',
  stem: 'stem',
  stemLight: 'stemLight',
  bark: 'bark',
  red: 'red',
  redDeep: 'redDeep',
  pink: 'pink',
  orange: 'orange',
  amber: 'amber',
  purple: 'purple',
  purpleDeep: 'purpleDeep',
  lime: 'lime',
  limeDeep: 'limeDeep',
  teal: 'teal',
  ivory: 'ivory',
  highlight: 'highlight',
  marker: 'marker',
  sky: 'sky',
} as const;

export type SceneColorName = (typeof SCENE_COLOR)[keyof typeof SCENE_COLOR];

export type GardenSceneColors = Readonly<Record<SceneColorName, string>>;

const RAMP = {
  primary: 'primary',
  gray: 'gray',
  orange: 'orange',
  lime: 'lime',
  cyan: 'cyan',
  violet: 'violet',
  rose: 'rose',
} as const;

type RampName = (typeof RAMP)[keyof typeof RAMP];

const RAMP_HUE: Readonly<Record<RampName, number>> = {
  primary: 160,
  gray: 160,
  orange: 51,
  lime: 108,
  cyan: 197,
  violet: 286,
  rose: 355,
};

const STEP_LIGHTNESS = {
  50: 0.972,
  100: 0.94,
  200: 0.885,
  300: 0.808,
  400: 0.72,
  500: 0.64,
  600: 0.56,
  700: 0.485,
  800: 0.41,
  900: 0.33,
} as const;

type RampStep = keyof typeof STEP_LIGHTNESS;

const STEP_CHROMA: Readonly<Record<RampStep, number>> = {
  50: 0.029,
  100: 0.054,
  200: 0.093,
  300: 0.128,
  400: 0.152,
  500: 0.16,
  600: 0.152,
  700: 0.131,
  800: 0.099,
  900: 0.067,
};

const GRAY_CHROMA_RATIO = 0.075;
const NEUTRAL_FACTOR = 1;
const ERROR_VARIABLE = '--error';
const ERROR_FALLBACK: OklchColor = { lightness: 0.55, chroma: 0.18, hue: 28 };

type SceneColorToken = {
  readonly variable: string;
  readonly fallback: OklchColor;
  readonly lightness: number;
  readonly chroma: number;
};

function rampToken(
  ramp: RampName,
  step: RampStep,
  lightness = NEUTRAL_FACTOR,
  chroma = NEUTRAL_FACTOR,
): SceneColorToken {
  return {
    variable: `--${ramp}-${step}`,
    fallback: {
      lightness: STEP_LIGHTNESS[step],
      chroma: STEP_CHROMA[step] * (ramp === RAMP.gray ? GRAY_CHROMA_RATIO : NEUTRAL_FACTOR),
      hue: RAMP_HUE[ramp],
    },
    lightness,
    chroma,
  };
}

function errorToken(lightness = NEUTRAL_FACTOR, chroma = NEUTRAL_FACTOR): SceneColorToken {
  return { variable: ERROR_VARIABLE, fallback: ERROR_FALLBACK, lightness, chroma };
}

type SceneColorTokens = Readonly<Record<SceneColorName, SceneColorToken>>;

const LIGHT_TOKENS: SceneColorTokens = {
  fieldSoil: rampToken(RAMP.orange, 800, 1.05, 0.5),
  fieldFurrow: rampToken(RAMP.orange, 900, 1.05, 0.45),
  grass: rampToken(RAMP.primary, 700, 1.05, 0.42),
  bedSoil: rampToken(RAMP.orange, 700, 1, 0.45),
  bedFurrow: rampToken(RAMP.orange, 700, 1.14, 0.42),
  wood: rampToken(RAMP.orange, 600, 1.05, 0.55),
  woodDark: rampToken(RAMP.orange, 800, 1, 0.5),
  stone: rampToken(RAMP.gray, 400),
  leafDeep: rampToken(RAMP.primary, 800, 1.05, 0.9),
  leaf: rampToken(RAMP.primary, 600),
  leafBright: rampToken(RAMP.primary, 400),
  stem: rampToken(RAMP.lime, 700),
  stemLight: rampToken(RAMP.lime, 500),
  bark: rampToken(RAMP.orange, 900, 1.15, 0.3),
  red: errorToken(1.15),
  redDeep: errorToken(1),
  pink: rampToken(RAMP.rose, 300),
  orange: rampToken(RAMP.orange, 500),
  amber: rampToken(RAMP.orange, 400),
  purple: rampToken(RAMP.violet, 600),
  purpleDeep: rampToken(RAMP.violet, 700),
  lime: rampToken(RAMP.lime, 400),
  limeDeep: rampToken(RAMP.lime, 600),
  teal: rampToken(RAMP.cyan, 500),
  ivory: rampToken(RAMP.gray, 100),
  highlight: rampToken(RAMP.primary, 400),
  marker: rampToken(RAMP.primary, 600),
  sky: rampToken(RAMP.gray, 50),
};

const DARK_TOKENS: SceneColorTokens = {
  fieldSoil: rampToken(RAMP.orange, 800, 1, 0.5),
  fieldFurrow: rampToken(RAMP.orange, 900, 0.85, 0.45),
  grass: rampToken(RAMP.primary, 800, 0.95, 0.5),
  bedSoil: rampToken(RAMP.orange, 700, 1, 0.45),
  bedFurrow: rampToken(RAMP.orange, 700, 1.06, 0.42),
  wood: rampToken(RAMP.orange, 700, 0.95, 0.55),
  woodDark: rampToken(RAMP.orange, 900, 0.95, 0.5),
  stone: rampToken(RAMP.gray, 600),
  leafDeep: rampToken(RAMP.primary, 700, 1, 0.9),
  leaf: rampToken(RAMP.primary, 500),
  leafBright: rampToken(RAMP.primary, 300),
  stem: rampToken(RAMP.lime, 600),
  stemLight: rampToken(RAMP.lime, 400),
  bark: rampToken(RAMP.orange, 900, 1, 0.3),
  red: errorToken(1.3),
  redDeep: errorToken(1.15),
  pink: rampToken(RAMP.rose, 300),
  orange: rampToken(RAMP.orange, 400),
  amber: rampToken(RAMP.orange, 300),
  purple: rampToken(RAMP.violet, 500),
  purpleDeep: rampToken(RAMP.violet, 600),
  lime: rampToken(RAMP.lime, 300),
  limeDeep: rampToken(RAMP.lime, 500),
  teal: rampToken(RAMP.cyan, 400),
  ivory: rampToken(RAMP.gray, 200),
  highlight: rampToken(RAMP.primary, 300),
  marker: rampToken(RAMP.primary, 400),
  sky: rampToken(RAMP.gray, 900, 0.67),
};

const SCENE_COLOR_NAMES = Object.values(SCENE_COLOR);

@Injectable({ providedIn: 'root' })
export class GardenSceneThemeService {
  readonly #document = inject(DOCUMENT);
  readonly #isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly #theme = inject(ThemeService);

  readonly colors = computed<GardenSceneColors>(() =>
    this.#resolveTokens(this.#theme.isDark() ? DARK_TOKENS : LIGHT_TOKENS),
  );

  #resolveTokens(tokens: SceneColorTokens): GardenSceneColors {
    const rootStyle = this.#isBrowser ? getComputedStyle(this.#document.documentElement) : null;
    return SCENE_COLOR_NAMES.reduce<Record<SceneColorName, string>>((colors, name) => {
      const token = tokens[name];
      const declared = rootStyle?.getPropertyValue(token.variable).trim() ?? '';
      const base = parseOklch(declared) ?? token.fallback;
      return {
        ...colors,
        [name]: oklchToHex(scaleOklch(base, token.lightness, token.chroma)),
      };
    }, {} as Record<SceneColorName, string>);
  }
}
