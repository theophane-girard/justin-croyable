import { TestScheduler } from 'rxjs/testing';

import { withLoadingDelay } from './with-loading-delay';

describe('withLoadingDelay', () => {
  let scheduler: TestScheduler;

  beforeEach(() => {
    scheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  it('n’affiche rien quand la navigation est plus rapide que le délai d’apparition', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const source = cold('t 9ms f', { t: true, f: false });
      const result = source.pipe(withLoadingDelay(30, 100, scheduler));
      expectObservable(result).toBe('10ms f', { f: false });
    });
  });

  it('devient visible après le délai d’apparition sur une navigation lente', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const source = cold('t', { t: true });
      const result = source.pipe(withLoadingDelay(30, 100, scheduler));
      expectObservable(result, '^ 50ms !').toBe('30ms t', { t: true });
    });
  });

  it('maintient le skeleton pendant la durée minimale d’affichage', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const source = cold('t 39ms f', { t: true, f: false });
      const result = source.pipe(withLoadingDelay(30, 100, scheduler));
      expectObservable(result, '^ 200ms !').toBe('30ms t 99ms f', { t: true, f: false });
    });
  });
});
