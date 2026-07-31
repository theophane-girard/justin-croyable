import { ChangeDetectionStrategy, Component, computed, input, ViewEncapsulation } from '@angular/core';

import type { ClassValue } from 'clsx';

import { mergeClasses } from '../../utils/merge-classes';

import { avatarGroupVariants, type AvatarGroupOrientationVariants } from './avatar.variants';

@Component({
  selector: 'app-avatar-group',
  template: `
    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'classes()',
  },
  exportAs: 'appAvatarGroup',
})
export class AvatarGroupComponent {
  readonly orientation = input<AvatarGroupOrientationVariants>('horizontal');
  readonly class = input<ClassValue>('');

  protected readonly classes = computed(() =>
    mergeClasses(avatarGroupVariants({ orientation: this.orientation() }), this.class()),
  );
}
