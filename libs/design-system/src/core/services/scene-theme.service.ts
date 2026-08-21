import { isPlatformBrowser } from '@angular/common';
import { computed, DOCUMENT, inject, Injectable, PLATFORM_ID, type Signal } from '@angular/core';

import { oklchToHex, type OklchColor, parseOklch, scaleOklch } from '../../utils/oklch-color';

import { ThemeService } from './theme.service';

export const SCENE_RAMP = {
  brand: 'brand',
  primary: 'primary',
  gray: 'gray',
  orange: 'orange',
  lime: 'lime',
  cyan: 'cyan',
  violet: 'violet',
  rose: 'rose',
} as const;

export type SceneRamp = (typeof SCENE_RAMP)[keyof typeof SCENE_RAMP];

export const SCENE_SEMANTIC = {
  success: 'success',
  warning: 'warning',
  error: 'error',
  info: 'info',
} as const;

export type SceneSemantic = (typeof SCENE_SEMANTIC)[keyof typeof SCENE_SEMANTIC];

const RAMP_HUE: Readonly<Record<SceneRamp, number>> = {
  brand: 323,
  primary: 323,
  gray: 323,
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

export type SceneRampStep = keyof typeof STEP_LIGHTNESS;

const STEP_CHROMA: Readonly<Record<SceneRampStep, number>> = {
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

const SEMANTIC_FALLBACK: Readonly<Record<SceneSemantic, OklchColor>> = {
  success: { lightness: 0.55, chroma: 0.15, hue: 145 },
  warning: { lightness: 0.62, chroma: 0.13, hue: 75 },
  error: { lightness: 0.55, chroma: 0.18, hue: 28 },
  info: { lightness: 0.55, chroma: 0.15, hue: 250 },
};

const GRAY_CHROMA_RATIO = 0.075;
const NEUTRAL_FACTOR = 1;

export type SceneColorToken = {
  readonly variable: string;
  readonly fallback: OklchColor;
  readonly lightness: number;
  readonly chroma: number;
};

export function sceneRamp(
  ramp: SceneRamp,
  step: SceneRampStep,
  lightness = NEUTRAL_FACTOR,
  chroma = NEUTRAL_FACTOR,
): SceneColorToken {
  return {
    variable: `--${ramp}-${step}`,
    fallback: {
      lightness: STEP_LIGHTNESS[step],
      chroma: STEP_CHROMA[step] * (ramp === SCENE_RAMP.gray ? GRAY_CHROMA_RATIO : NEUTRAL_FACTOR),
      hue: RAMP_HUE[ramp],
    },
    lightness,
    chroma,
  };
}

export function sceneSemantic(
  semantic: SceneSemantic,
  lightness = NEUTRAL_FACTOR,
  chroma = NEUTRAL_FACTOR,
): SceneColorToken {
  return {
    variable: `--${semantic}`,
    fallback: SEMANTIC_FALLBACK[semantic],
    lightness,
    chroma,
  };
}

export type SceneThemeTokens<TName extends string> = {
  readonly light: Readonly<Record<TName, SceneColorToken>>;
  readonly dark: Readonly<Record<TName, SceneColorToken>>;
};

export type SceneColors<TName extends string> = Readonly<Record<TName, string>>;

export const SCENE_ROLE = {
  ground: 'ground',
  groundAlt: 'groundAlt',
  surface: 'surface',
  surfaceAlt: 'surfaceAlt',
  ink: 'ink',
  inkMuted: 'inkMuted',
  border: 'border',
  accent: 'accent',
  accentSoft: 'accentSoft',
  accentStrong: 'accentStrong',
  highlight: 'highlight',
  sky: 'sky',
  series1: 'series1',
  series2: 'series2',
  series3: 'series3',
  series4: 'series4',
  series5: 'series5',
  series6: 'series6',
  success: 'success',
  warning: 'warning',
  error: 'error',
  info: 'info',
} as const;

export type SceneRoleName = (typeof SCENE_ROLE)[keyof typeof SCENE_ROLE];

const SCENE_ROLE_TOKENS: SceneThemeTokens<SceneRoleName> = {
  light: {
    ground: sceneRamp(SCENE_RAMP.gray, 200),
    groundAlt: sceneRamp(SCENE_RAMP.gray, 300),
    surface: sceneRamp(SCENE_RAMP.gray, 50),
    surfaceAlt: sceneRamp(SCENE_RAMP.gray, 100),
    ink: sceneRamp(SCENE_RAMP.gray, 900),
    inkMuted: sceneRamp(SCENE_RAMP.gray, 600),
    border: sceneRamp(SCENE_RAMP.gray, 300),
    accent: sceneRamp(SCENE_RAMP.primary, 500),
    accentSoft: sceneRamp(SCENE_RAMP.primary, 300),
    accentStrong: sceneRamp(SCENE_RAMP.primary, 700),
    highlight: sceneRamp(SCENE_RAMP.primary, 400),
    sky: sceneRamp(SCENE_RAMP.gray, 50),
    series1: sceneRamp(SCENE_RAMP.primary, 500),
    series2: sceneRamp(SCENE_RAMP.cyan, 500),
    series3: sceneRamp(SCENE_RAMP.violet, 500),
    series4: sceneRamp(SCENE_RAMP.orange, 500),
    series5: sceneRamp(SCENE_RAMP.lime, 500),
    series6: sceneRamp(SCENE_RAMP.rose, 500),
    success: sceneSemantic(SCENE_SEMANTIC.success),
    warning: sceneSemantic(SCENE_SEMANTIC.warning),
    error: sceneSemantic(SCENE_SEMANTIC.error),
    info: sceneSemantic(SCENE_SEMANTIC.info),
  },
  dark: {
    ground: sceneRamp(SCENE_RAMP.gray, 800),
    groundAlt: sceneRamp(SCENE_RAMP.gray, 900),
    surface: sceneRamp(SCENE_RAMP.gray, 800),
    surfaceAlt: sceneRamp(SCENE_RAMP.gray, 700),
    ink: sceneRamp(SCENE_RAMP.gray, 50),
    inkMuted: sceneRamp(SCENE_RAMP.gray, 400),
    border: sceneRamp(SCENE_RAMP.gray, 700),
    accent: sceneRamp(SCENE_RAMP.primary, 400),
    accentSoft: sceneRamp(SCENE_RAMP.primary, 200),
    accentStrong: sceneRamp(SCENE_RAMP.primary, 600),
    highlight: sceneRamp(SCENE_RAMP.primary, 300),
    sky: sceneRamp(SCENE_RAMP.gray, 900, 0.67),
    series1: sceneRamp(SCENE_RAMP.primary, 400),
    series2: sceneRamp(SCENE_RAMP.cyan, 400),
    series3: sceneRamp(SCENE_RAMP.violet, 400),
    series4: sceneRamp(SCENE_RAMP.orange, 400),
    series5: sceneRamp(SCENE_RAMP.lime, 400),
    series6: sceneRamp(SCENE_RAMP.rose, 400),
    success: sceneSemantic(SCENE_SEMANTIC.success, 1.2),
    warning: sceneSemantic(SCENE_SEMANTIC.warning, 1.15),
    error: sceneSemantic(SCENE_SEMANTIC.error, 1.25),
    info: sceneSemantic(SCENE_SEMANTIC.info, 1.2),
  },
};

export const SCENE_SERIES_ROLES: readonly SceneRoleName[] = [
  SCENE_ROLE.series1,
  SCENE_ROLE.series2,
  SCENE_ROLE.series3,
  SCENE_ROLE.series4,
  SCENE_ROLE.series5,
  SCENE_ROLE.series6,
];

@Injectable({ providedIn: 'root' })
export class SceneThemeService {
  readonly #document = inject(DOCUMENT);
  readonly #isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly #theme = inject(ThemeService);

  readonly roles = this.palette(SCENE_ROLE_TOKENS);

  palette<TName extends string>(tokens: SceneThemeTokens<TName>): Signal<SceneColors<TName>> {
    return computed(() => this.#resolve(this.#theme.isDark() ? tokens.dark : tokens.light));
  }

  #resolve<TName extends string>(
    tokens: Readonly<Record<TName, SceneColorToken>>,
  ): SceneColors<TName> {
    const rootStyle = this.#isBrowser ? getComputedStyle(this.#document.documentElement) : null;
    const names = Object.keys(tokens) as TName[];
    return names.reduce<Record<TName, string>>((colors, name) => {
      const token = tokens[name];
      const declared = rootStyle?.getPropertyValue(token.variable).trim() ?? '';
      const base = parseOklch(declared) ?? token.fallback;
      return { ...colors, [name]: oklchToHex(scaleOklch(base, token.lightness, token.chroma)) };
    }, {} as Record<TName, string>);
  }
}
