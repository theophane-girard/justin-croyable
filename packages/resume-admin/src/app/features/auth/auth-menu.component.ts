import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { AvatarComponent, ButtonComponent } from '@justin-croyable/design-system';
import { NgIcon } from '@ng-icons/core';

import { AuthService } from '../../core/auth.service';

function initialsOf(label: string): string {
  return label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('');
}

@Component({
  selector: 'app-auth-menu',
  imports: [AvatarComponent, ButtonComponent, NgIcon],
  template: `
    @if (user(); as currentUser) {
      <div class="flex items-center gap-2">
        <app-avatar
          size="sm"
          [src]="currentUser.photoURL ?? ''"
          [alt]="displayName()"
          [fallback]="initials()"
        />
        <span class="hidden text-sm font-medium sm:inline">{{ displayName() }}</span>
        <button
          appButton
          variant="ghost"
          size="sm"
          aria-label="Se déconnecter"
          (click)="onSignOut()"
        >
          <ng-icon name="phosphorSignOut" class="size-4" />
        </button>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthMenuComponent {
  readonly #auth = inject(AuthService);

  protected readonly user = this.#auth.user;

  protected readonly displayName = computed(() => {
    const currentUser = this.user();
    if (!currentUser) {
      return '';
    }
    return currentUser.displayName ?? currentUser.email ?? 'Utilisateur';
  });

  protected readonly initials = computed(() => initialsOf(this.displayName()));

  protected onSignOut(): void {
    this.#auth.signOut().catch(() => undefined);
  }
}
