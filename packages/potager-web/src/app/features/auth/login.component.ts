import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ButtonComponent, CardComponent } from '@justin-croyable/design-system';
import { NgIcon } from '@ng-icons/core';

import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  imports: [CardComponent, ButtonComponent, NgIcon],
  template: `
    <div class="bg-background text-foreground flex h-dvh items-center justify-center p-4">
      <app-card class="w-full max-w-sm">
        <div class="flex flex-col items-center gap-6 p-6 text-center">
          <div class="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-2xl">
            <ng-icon name="phosphorPlant" class="size-7" />
          </div>
          <div class="flex flex-col gap-1">
            <h1 class="text-xl font-semibold">Mon Potager</h1>
            <p class="text-muted-foreground text-sm">Connecte-toi pour accéder à ton potager.</p>
          </div>
          <button appButton class="w-full" (click)="onSignIn()">
            <ng-icon name="phosphorGoogleLogo" class="size-4" />
            Se connecter avec Google
          </button>
        </div>
      </app-card>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  readonly #auth = inject(AuthService);

  protected onSignIn(): void {
    this.#auth.signInWithGoogle().catch(() => undefined);
  }
}
