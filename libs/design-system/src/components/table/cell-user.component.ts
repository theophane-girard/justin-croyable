import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';
import type { SafeUrl } from '@angular/platform-browser';

import type { ClassValue } from 'clsx';

import { mergeClasses } from '../../utils/merge-classes';
import { AvatarComponent } from '../avatar';
import { type AvatarSizeVariants } from '../avatar/avatar.variants';

@Component({
  selector: 'app-cell-user',
  imports: [AvatarComponent],
  template: `
    <app-avatar
      [size]="size()"
      [src]="avatarSrc()"
      [alt]="primaryLabel()"
      [fallback]="initials()"
    />
    <span class="flex min-w-0 flex-col leading-tight">
      <span class="text-foreground truncate text-sm font-medium">{{ primaryLabel() }}</span>
      @if (secondaryLabel(); as secondary) {
        <span class="text-muted-foreground truncate text-xs">{{ secondary }}</span>
      }
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'classes()',
  },
  exportAs: 'appCellUser',
})
export class CellUserComponent {
  readonly firstName = input<string>('');
  readonly lastName = input<string>('');
  readonly email = input<string>('');
  readonly avatarSrc = input<string | SafeUrl>('');
  readonly size = input<AvatarSizeVariants>('default');
  readonly class = input<ClassValue>('');

  protected readonly fullName = computed(() =>
    [this.firstName(), this.lastName()]
      .map((part) => part.trim())
      .filter((part) => part.length > 0)
      .join(' '),
  );

  protected readonly primaryLabel = computed(() => this.fullName() || this.email());

  protected readonly secondaryLabel = computed(() => (this.fullName() ? this.email() : ''));

  protected readonly initials = computed(() => {
    const first = this.firstName().trim();
    const last = this.lastName().trim();
    if (first || last) {
      return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
    }
    return this.email().trim().charAt(0).toUpperCase();
  });

  protected readonly classes = computed(() =>
    mergeClasses('inline-flex min-w-0 max-w-full items-center gap-2', this.class()),
  );
}
