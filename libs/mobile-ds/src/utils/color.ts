/**
 * Convertit des canaux RGB stockés en tokens ("226 232 240") vers une couleur
 * `rgb(...)` à virgules, parsable par React Native (et par l'API `Animated`).
 *
 * @example channelsToRgb('37 99 235') // 'rgb(37,99,235)'
 */
export function channelsToRgb(channels: string): string {
  return `rgb(${channels.trim().split(/\s+/).join(',')})`;
}
