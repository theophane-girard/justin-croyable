import type { ActivatedRouteSnapshot } from '@angular/router';

import { deepestSkeletonKind } from './deepest-skeleton-kind';

function snapshot(
  data: Record<string, unknown>,
  firstChild: ActivatedRouteSnapshot | null = null,
): ActivatedRouteSnapshot {
  return { data, firstChild } as unknown as ActivatedRouteSnapshot;
}

describe('deepestSkeletonKind', () => {
  it('retourne null pour une racine absente', () => {
    expect(deepestSkeletonKind(null)).toBeNull();
  });

  it('retourne null quand aucune route ne déclare de skeleton', () => {
    const root = snapshot({}, snapshot({}));
    expect(deepestSkeletonKind(root)).toBeNull();
  });

  it('lit le skeleton déclaré sur une route unique', () => {
    expect(deepestSkeletonKind(snapshot({ skeleton: 'list' }))).toBe('list');
  });

  it('hérite du parent quand l’enfant ne déclare rien', () => {
    const root = snapshot({ skeleton: 'dashboard' }, snapshot({}));
    expect(deepestSkeletonKind(root)).toBe('dashboard');
  });

  it('donne la priorité à l’enfant le plus profond', () => {
    const root = snapshot(
      { skeleton: 'dashboard' },
      snapshot({}, snapshot({ skeleton: 'detail' })),
    );
    expect(deepestSkeletonKind(root)).toBe('detail');
  });

  it('ignore une valeur vide ou non-chaîne', () => {
    expect(deepestSkeletonKind(snapshot({ skeleton: '' }))).toBeNull();
    expect(deepestSkeletonKind(snapshot({ skeleton: 42 }))).toBeNull();
  });
});
