import {
  Directive,
  effect,
  inject,
  input,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';

import { RouteSkeletonRegistryService } from './route-skeleton-registry.service';
import type { SkeletonKind } from './skeleton-kind';
import { ROUTE_SKELETON_CONFIG } from './route-skeleton.tokens';
import { withLoadingDelay } from './with-loading-delay';

@Directive({
  selector: '[skeletonWhile]',
})
export class SkeletonWhileDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  readonly #viewContainer = inject(ViewContainerRef);
  readonly #registry = inject(RouteSkeletonRegistryService);
  readonly #config = inject(ROUTE_SKELETON_CONFIG);

  readonly loading = input.required<boolean>({ alias: 'skeletonWhile' });
  readonly kind = input<SkeletonKind | null>(null, { alias: 'skeletonWhileKind' });

  readonly #visible = toSignal(
    toObservable(this.loading).pipe(
      withLoadingDelay(this.#config.appearDelayMs, this.#config.minVisibleMs),
    ),
    { initialValue: false },
  );

  #showingSkeleton: boolean | null = null;

  constructor() {
    effect(() => this.#sync(this.#visible(), this.kind()));
  }

  #sync(showSkeleton: boolean, kind: SkeletonKind | null): void {
    if (this.#showingSkeleton === showSkeleton) {
      return;
    }
    this.#showingSkeleton = showSkeleton;
    this.#viewContainer.clear();
    if (!showSkeleton) {
      this.#viewContainer.createEmbeddedView(this.templateRef);
      return;
    }
    const component = this.#registry.resolve(kind);
    if (component) {
      this.#viewContainer.createComponent(component);
    }
  }
}
