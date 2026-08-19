import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { ButtonComponent, CardComponent } from '@justin-croyable/design-system';
import { NgIcon } from '@ng-icons/core';

import { AuthService } from '../../core/auth.service';
import { SessionStore } from '../../core/session-store';

@Component({
  selector: 'app-forbidden',
  imports: [CardComponent, ButtonComponent, NgIcon],
  template: `
    <div class="bg-background text-foreground flex h-dvh items-center justify-center p-4">
      <app-card class="w-full max-w-sm">
        <div class="flex flex-col items-center gap-6 p-6 text-center">
          <div
            class="bg-destructive/10 text-destructive flex size-14 items-center justify-center rounded-2xl"
          >
            <ng-icon name="phosphorLock" class="size-7" />
          </div>
          <div class="flex flex-col gap-1">
            <h1 class="text-xl font-semibold">Accès refusé</h1>
            <p class="text-muted-foreground text-sm">
              Le compte <span class="font-medium">{{ email() }}</span> n'est pas autorisé à modifier
              ce CV.
            </p>
          </div>
          <button appButton variant="outline" class="w-full" (click)="onSignOut()">
            <ng-icon name="phosphorSignOut" class="size-4" />
            Changer de compte
          </button>
        </div>
      </app-card>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForbiddenComponent {
  readonly #auth = inject(AuthService);
  readonly #session = inject(SessionStore);

  protected readonly email = computed(() => this.#session.session()?.email ?? '');

  protected onSignOut(): void {
    this.#auth.signOut().catch(() => undefined);
  }
}
