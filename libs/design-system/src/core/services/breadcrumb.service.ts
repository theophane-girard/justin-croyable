import { Injectable, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRouteSnapshot, NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

export type Breadcrumb = { label: string; url: string };

/**
 * Derives the breadcrumb trail from the router state.
 *
 * Each route declares its label via `data.breadcrumb`; this service walks the
 * activated route tree on every navigation and collects the segments that have
 * one, exposing the result as a signal.
 */
@Injectable({ providedIn: 'root' })
export class BreadcrumbService {
  private readonly router = inject(Router);

  readonly breadcrumbs = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      // Build the trail on first read too, not only after a navigation.
      startWith(null),
      map(() => this.build(this.router.routerState.snapshot.root)),
    ),
    { initialValue: [] as Breadcrumb[] },
  );

  private build(root: ActivatedRouteSnapshot): Breadcrumb[] {
    const crumbs: Breadcrumb[] = [];
    let url = '';
    for (let node: ActivatedRouteSnapshot | null = root; node; node = node.firstChild) {
      const segment = node.url.map((s) => s.path).join('/');
      if (segment) {
        url += `/${segment}`;
      }
      // Read the route's OWN data, not the inherited one — otherwise a child
      // with an empty path (e.g. lazy `{ path: '' }`) would inherit its
      // parent's breadcrumb and duplicate it.
      const label = node.routeConfig?.data?.['breadcrumb'] as string | undefined;
      if (label) {
        crumbs.push({ label, url });
      }
    }
    return crumbs;
  }
}
