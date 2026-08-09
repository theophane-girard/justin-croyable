export function range(length: number): number[] {
  return Array.from({ length: Math.max(0, Math.trunc(length)) }, (_, index) => index);
}
