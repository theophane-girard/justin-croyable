export type OklchColor = {
  readonly lightness: number;
  readonly chroma: number;
  readonly hue: number;
};

const OKLCH_PATTERN = /oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)/i;
const PERCENT_SIGN = '%';
const PERCENT_DIVISOR = 100;
const DEGREES_TO_RADIANS = Math.PI / 180;
const GAMMA_THRESHOLD = 0.0031308;
const GAMMA_LOW_SLOPE = 12.92;
const GAMMA_SCALE = 1.055;
const GAMMA_OFFSET = 0.055;
const GAMMA_EXPONENT = 1 / 2.4;
const CHANNEL_MAX = 255;
const HEX_RADIX = 16;
const HEX_PAIR_LENGTH = 2;
const HEX_PAIR_FILLER = '0';
const HEX_PREFIX = '#';
const CUBED = 3;

export function parseOklch(value: string): OklchColor | null {
  const match = OKLCH_PATTERN.exec(value);
  if (match === null) {
    return null;
  }
  const rawLightness = Number.parseFloat(match[1]);
  return {
    lightness: match[2] === PERCENT_SIGN ? rawLightness / PERCENT_DIVISOR : rawLightness,
    chroma: Number.parseFloat(match[3]),
    hue: Number.parseFloat(match[4]),
  };
}

export function scaleOklch(color: OklchColor, lightness: number, chroma: number): OklchColor {
  return {
    lightness: Math.min(color.lightness * lightness, 1),
    chroma: color.chroma * chroma,
    hue: color.hue,
  };
}

function toLinearSrgb({ lightness, chroma, hue }: OklchColor): readonly number[] {
  const radians = hue * DEGREES_TO_RADIANS;
  const green = chroma * Math.cos(radians);
  const blue = chroma * Math.sin(radians);
  const long = (lightness + 0.3963377774 * green + 0.2158037573 * blue) ** CUBED;
  const medium = (lightness - 0.1055613458 * green - 0.0638541728 * blue) ** CUBED;
  const short = (lightness - 0.0894841775 * green - 1.291485548 * blue) ** CUBED;
  return [
    4.0767416621 * long - 3.3077115913 * medium + 0.2309699292 * short,
    -1.2684380046 * long + 2.6097574011 * medium - 0.3413193965 * short,
    -0.0041960863 * long - 0.7034186147 * medium + 1.707614701 * short,
  ];
}

function toHexPair(channel: number): string {
  const clamped = Math.min(Math.max(channel, 0), 1);
  const encoded =
    clamped <= GAMMA_THRESHOLD
      ? clamped * GAMMA_LOW_SLOPE
      : GAMMA_SCALE * clamped ** GAMMA_EXPONENT - GAMMA_OFFSET;
  return Math.round(encoded * CHANNEL_MAX)
    .toString(HEX_RADIX)
    .padStart(HEX_PAIR_LENGTH, HEX_PAIR_FILLER);
}

export function oklchToHex(color: OklchColor): string {
  return `${HEX_PREFIX}${toLinearSrgb(color).map(toHexPair).join('')}`;
}
