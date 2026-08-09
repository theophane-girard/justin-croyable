function clamp(value: number, [min, max]: [number, number]): number {
  return Math.min(max, Math.max(min, value));
}

function roundToStep(value: number, min: number, step: number): number {
  return Math.round((value - min) / step) * step + min;
}

function convertValueToPercentage(value: number, min: number, max: number): number {
  return ((value - min) / (max - min)) * 100;
}

function convertPercentageToValue(percentage: number, min: number, max: number, step: number): number {
  const raw = min + (max - min) * clamp(percentage, [0, 1]);
  return clamp(roundToStep(raw, min, step), [min, max]);
}

export { clamp, roundToStep, convertValueToPercentage, convertPercentageToValue };
