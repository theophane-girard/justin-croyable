import { NgOptimizedImage } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import type { SafeUrl } from '@angular/platform-browser';

import { NgIcon } from '@ng-icons/core';
import type { ClassValue } from 'clsx';

import { mergeClasses } from '../../utils/merge-classes';

import {
  avatarVariants,
  avatarBadgeVariants,
  fallbackVariants,
  imageVariants,
  type AvatarSizeVariants,
} from './avatar.variants';

@Component({
  selector: 'app-avatar, [app-avatar]',
  imports: [NgOptimizedImage, NgIcon],
  template: `
    @if (fallback() && (!src() || !imageLoaded())) {
      <span [class]="fallbackClasses()">
        {{ fallback() }}
      </span>
    }

    @if (src() && !imageError()) {
      <img
        [width]="32"
        [height]="32"
        [alt]="alt()"
        [class]="imgClasses()"
        [ngSrc]="src()"
        [priority]="priority()"
        (error)="onImageError()"
        (load)="onImageLoad()"
      />
    }

    @if (showBadge()) {
      <div [class]="badgeClasses()">
        @if (badgeIcon()) {
          <ng-icon [name]="badgeIcon()" size="8" />
        }
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'avatarClasses()',
    '[attr.data-slot]': '"avatar"',
    '[attr.data-size]': 'size()',
  },
  exportAs: 'appAvatar',
})
export class AvatarComponent {
  readonly class = input<ClassValue>('');
  readonly alt = input<string>('');
  readonly badgeClass = input<ClassValue>('');
  readonly badgeIcon = input<string>('');
  readonly fallback = input<string>('');
  readonly priority = input(false, { transform: booleanAttribute });
  readonly size = input<AvatarSizeVariants>('default');
  readonly src = input<string | SafeUrl>('');
  readonly showBadge = input(false, { transform: booleanAttribute });

  protected readonly imageError = signal(false);
  protected readonly imageLoaded = signal(false);

  constructor() {
    effect(() => {
      // Reset image state when src changes
      this.src();
      this.imageError.set(false);
      this.imageLoaded.set(false);
    });
  }

  protected readonly avatarClasses = computed(() =>
    mergeClasses(avatarVariants({ size: this.size() }), this.class()),
  );

  protected readonly fallbackClasses = computed(() => fallbackVariants());

  protected readonly badgeClasses = computed(() => mergeClasses(avatarBadgeVariants, this.badgeClass()));

  protected readonly imgClasses = computed(() => imageVariants({ size: this.size() }));

  protected onImageLoad(): void {
    this.imageLoaded.set(true);
    this.imageError.set(false);
  }

  protected onImageError(): void {
    this.imageError.set(true);
    this.imageLoaded.set(false);
  }
}
