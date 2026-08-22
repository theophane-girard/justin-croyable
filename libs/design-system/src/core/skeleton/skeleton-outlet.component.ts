import { NgComponentOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  ViewEncapsulation,
} from '@angular/core';

import { RouteSkeletonRegistryService } from './route-skeleton-registry.service';
import { RouteSkeletonStore } from './route-skeleton.store';

@Component({
  selector: 'app-skeleton-outlet',
  imports: [NgComponentOutlet],
  template: `
    @if (visible() && component()) {
      <div class="bg-background absolute inset-0 z-10" role="status" aria-live="polite">
        <ng-container *ngComponentOutlet="component()" />
      </div>
    }
    <div class="h-full" [class.invisible]="visible()" [attr.aria-busy]="visible()">
      <ng-content />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'relative block',
  },
})
export class SkeletonOutletComponent {
  readonly #store = inject(RouteSkeletonStore);
  readonly #registry = inject(RouteSkeletonRegistryService);

  protected readonly visible = this.#store.visible;
  protected readonly component = computed(() => this.#registry.resolve(this.#store.kind()));
}
