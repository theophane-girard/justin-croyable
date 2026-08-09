import {
  asyncScheduler,
  defer,
  type MonoTypeOperatorFunction,
  type SchedulerLike,
  timer,
} from 'rxjs';
import { distinctUntilChanged, map, switchMap, tap } from 'rxjs';

export function withLoadingDelay(
  appearDelayMs: number,
  minVisibleMs: number,
  scheduler: SchedulerLike = asyncScheduler,
): MonoTypeOperatorFunction<boolean> {
  return source =>
    defer(() => {
      let shownAt: number | null = null;
      return source.pipe(
        distinctUntilChanged(),
        switchMap(loading => {
          if (loading) {
            return timer(appearDelayMs, scheduler).pipe(map(() => true));
          }
          const remaining =
            shownAt === null ? 0 : Math.max(0, minVisibleMs - (scheduler.now() - shownAt));
          return timer(remaining, scheduler).pipe(map(() => false));
        }),
        distinctUntilChanged(),
        tap(visible => {
          shownAt = visible ? scheduler.now() : null;
        }),
      );
    });
}
