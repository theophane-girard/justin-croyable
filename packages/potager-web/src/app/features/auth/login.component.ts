import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FirebaseError } from 'firebase/app';

import {
  ButtonComponent,
  CardComponent,
  SonnerService,
  SpinnerComponent,
} from '@justin-croyable/design-system';
import { NgIcon } from '@ng-icons/core';

import { AuthService } from '../../core/auth.service';

const AUTH_ERROR_CODE = {
  unauthorizedDomain: 'auth/unauthorized-domain',
  popupBlocked: 'auth/popup-blocked',
  popupClosed: 'auth/popup-closed-by-user',
  cancelledPopup: 'auth/cancelled-popup-request',
  networkFailed: 'auth/network-request-failed',
} as const;

const AUTH_ERROR_MESSAGE: Record<string, string> = {
  [AUTH_ERROR_CODE.unauthorizedDomain]: "Ce domaine n'est pas autorisé pour la connexion Google.",
  [AUTH_ERROR_CODE.popupBlocked]: 'La fenêtre de connexion a été bloquée par le navigateur.',
  [AUTH_ERROR_CODE.networkFailed]: 'Connexion impossible : vérifie ta connexion internet.',
};

const DEFAULT_AUTH_ERROR_MESSAGE = 'La connexion a échoué. Réessaie.';

const SILENT_AUTH_ERROR_CODES: readonly string[] = [
  AUTH_ERROR_CODE.popupClosed,
  AUTH_ERROR_CODE.cancelledPopup,
];

@Component({
  selector: 'app-login',
  imports: [CardComponent, ButtonComponent, NgIcon, SpinnerComponent],
  template: `
    <div class="bg-background text-foreground flex h-dvh items-center justify-center p-4">
      @if (signingIn()) {
        <div class="text-muted-foreground flex flex-col items-center gap-4">
          <app-spinner class="text-primary size-10" />
          <p class="text-sm">Connexion en cours…</p>
        </div>
      } @else {
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
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  readonly #auth = inject(AuthService);
  readonly #sonner = inject(SonnerService);

  protected readonly signingIn = signal(false);

  protected onSignIn(): void {
    this.signingIn.set(true);
    this.#auth.signInWithGoogle().catch((error: unknown) => {
      this.signingIn.set(false);
      this.#notifyError(error);
    });
  }

  #notifyError(error: unknown): void {
    const code = error instanceof FirebaseError ? error.code : '';
    if (SILENT_AUTH_ERROR_CODES.includes(code)) {
      return;
    }
    this.#sonner.error(AUTH_ERROR_MESSAGE[code] ?? DEFAULT_AUTH_ERROR_MESSAGE);
  }
}
