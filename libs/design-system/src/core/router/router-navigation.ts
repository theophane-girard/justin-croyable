import { inject, type Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
} from '@angular/router';
import { filter, map } from 'rxjs';

import { normalizePath } from '../../utils/router-path';

type RouterLifecycleEvent = NavigationStart | NavigationEnd | NavigationCancel | NavigationError;

function isRouterLifecycleEvent(event: unknown): event is RouterLifecycleEvent {
  return (
    event instanceof NavigationStart ||
    event instanceof NavigationEnd ||
    event instanceof NavigationCancel ||
    event instanceof NavigationError
  );
}

export function injectRouterNavigating(): Signal<boolean> {
  const router = inject(Router);
  return toSignal(
    router.events.pipe(
      filter(isRouterLifecycleEvent),
      map(event => event instanceof NavigationStart),
    ),
    { initialValue: false },
  );
}

export function injectCurrentPath(): Signal<string> {
  const router = inject(Router);
  return toSignal(
    router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(event => normalizePath(event.urlAfterRedirects)),
    ),
    { initialValue: normalizePath(router.url) },
  );
}
