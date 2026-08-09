import { inject, type Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';

import { normalizePath } from '../../utils/router-path';

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
