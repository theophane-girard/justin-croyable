import { describe, expect, it } from 'vitest';

import { convertPercentageToValue, convertValueToPercentage } from './number';

describe('convertPercentageToValue', () => {
  it('atteint le max au-delà de 100 (domaine 0-252)', () => {
    expect(convertPercentageToValue(1, 0, 252, 4)).toBe(252);
  });

  it('atteint le min', () => {
    expect(convertPercentageToValue(0, 0, 252, 4)).toBe(0);
  });

  it('arrondit au pas le plus proche', () => {
    expect(convertPercentageToValue(0.5, 0, 252, 4)).toBe(128);
  });

  it('borne les pourcentages hors intervalle', () => {
    expect(convertPercentageToValue(1.5, 0, 252, 4)).toBe(252);
    expect(convertPercentageToValue(-0.5, 0, 252, 4)).toBe(0);
  });

  it('reste correct sur le domaine 0-100 par défaut', () => {
    expect(convertPercentageToValue(1, 0, 100, 1)).toBe(100);
    expect(convertPercentageToValue(0.4, 0, 100, 1)).toBe(40);
  });

  it('gère un domaine fractionnaire', () => {
    expect(convertPercentageToValue(0.5, 0, 1, 0.1)).toBeCloseTo(0.5);
  });
});

describe('convertValueToPercentage', () => {
  it('positionne le curseur en pourcentage du domaine réel', () => {
    expect(convertValueToPercentage(252, 0, 252)).toBe(100);
    expect(convertValueToPercentage(126, 0, 252)).toBe(50);
    expect(convertValueToPercentage(50, 0, 100)).toBe(50);
  });
});
