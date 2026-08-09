import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideLoaderCircle } from '@ng-icons/lucide';
import type { ClassValue } from 'clsx';

import { mergeClasses } from '../../utils/merge-classes';
import { BadgeComponent, type BadgeTypeVariants } from '../badge';

import {
  fabButtonVariants,
  type FabButtonBadge,
  type FabButtonPosition,
  type FabButtonSize,
  type FabButtonType,
} from './fab-button.variants';

@Component({
  selector: 'app-fab-button, button[appFabButton], a[appFabButton]',
  imports: [NgIcon, BadgeComponent],
  template: `
    @if (loading()) {
      <ng-icon name="lucideLoaderCircle" class="animate-spin duration-2000" />
    } @else {
      <ng-content />
    }
    @if (showBadge()) {
      <app-badge
        [type]="badgeType()"
        shape="pill"
        class="pointer-events-none absolute -top-1 -right-1 h-5 min-w-5 justify-center px-1 tabular-nums"
        aria-hidden="true"
      >
        {{ badge() }}
      </app-badge>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  viewProviders: [provideIcons({ lucideLoaderCircle })],
  host: {
    '[class]': 'classes()',
    '[attr.data-disabled]': 'isNotNativeControl() && fabDisabled() || null',
    '[attr.aria-disabled]': 'isNotNativeControl() && fabDisabled() || null',
    '[attr.disabled]': 'isNotNativeControl() && fabDisabled() ? "" : null',
  },
  exportAs: 'fabButton',
})
export class FabButtonComponent {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly variant = input<FabButtonType>('default');
  readonly size = input<FabButtonSize>('default');
  readonly position = input<FabButtonPosition>('static');
  readonly class = input<ClassValue>('');
  readonly loading = input(false, { transform: booleanAttribute });
  readonly fabDisabled = input(false, { transform: booleanAttribute });
  readonly badge = input<FabButtonBadge>(null);
  readonly badgeType = input<BadgeTypeVariants>('destructive');

  constructor() {
    if (this.needsButtonSemantics()) {
      const host = this.elementRef.nativeElement;
      host.setAttribute('role', 'button');
      host.setAttribute('tabindex', '0');
    }
  }

  protected readonly showBadge = computed(() => {
    const value = this.badge();
    return value !== null && value !== '' && value !== 0;
  });

  protected readonly classes = computed(() =>
    mergeClasses(
      fabButtonVariants({
        type: this.variant(),
        size: this.size(),
        position: this.position(),
        loading: this.loading(),
        disabled: this.fabDisabled(),
      }),
      this.showBadge() && this.position() === 'static' ? 'relative' : '',
      this.class(),
    ),
  );

  protected readonly isNotNativeControl = computed(() => {
    const { tagName } = this.elementRef.nativeElement;
    return tagName !== 'BUTTON' && tagName !== 'A';
  });

  private needsButtonSemantics(): boolean {
    return this.isNotNativeControl();
  }
}
