import { inject, Injectable, type Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RoutesRecognized,
} from '@angular/router';
import { filter, map } from 'rxjs';

import { deepestSkeletonKind } from './deepest-skeleton-kind';
import type { SkeletonKind } from './skeleton-kind';
import { ROUTE_SKELETON_CONFIG } from './route-skeleton.tokens';
import { withLoadingDelay } from './with-loading-delay';

type NavigationLifecycleEvent =
  | NavigationStart
  | NavigationEnd
  | NavigationCancel
  | NavigationError;

function isNavigationLifecycleEvent(event: unknown): event is NavigationLifecycleEvent {
  return (
    event instanceof NavigationStart ||
    event instanceof NavigationEnd ||
    event instanceof NavigationCancel ||
    event instanceof NavigationError
  );
}

@Injectable({ providedIn: 'root' })
export class RouteSkeletonStore {
  readonly #router = inject(Router);
  readonly #config = inject(ROUTE_SKELETON_CONFIG);

  readonly kind: Signal<SkeletonKind | null> = toSignal(
    this.#router.events.pipe(
      filter((event): event is RoutesRecognized => event instanceof RoutesRecognized),
      map(event => deepestSkeletonKind(event.state.root)),
    ),
    { initialValue: null },
  );

  readonly visible: Signal<boolean> = toSignal(
    this.#router.events.pipe(
      filter(isNavigationLifecycleEvent),
      map(event => event instanceof NavigationStart),
      withLoadingDelay(this.#config.appearDelayMs, this.#config.minVisibleMs),
    ),
    { initialValue: false },
  );
}
