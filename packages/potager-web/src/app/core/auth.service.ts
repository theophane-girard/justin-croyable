import { computed, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { getApps, initializeApp } from 'firebase/app';
import {
  type Auth,
  GoogleAuthProvider,
  getAuth,
  onIdTokenChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { Observable } from 'rxjs';

import { FIREBASE_CONFIG } from './app-config';

type AuthState = { readonly user: User | null; readonly ready: boolean };

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly #auth: Auth = getAuth(getApps().at(0) ?? initializeApp(FIREBASE_CONFIG));

  readonly #state$ = new Observable<AuthState>(subscriber =>
    onIdTokenChanged(this.#auth, user => subscriber.next({ user, ready: true })),
  );

  readonly #state = toSignal(this.#state$, {
    initialValue: { user: this.#auth.currentUser, ready: false } satisfies AuthState,
  });

  readonly user = computed(() => this.#state().user);
  readonly ready = computed(() => this.#state().ready);
  readonly isAuthenticated = computed(() => this.#state().user !== null);

  signInWithGoogle(): Promise<unknown> {
    return signInWithPopup(this.#auth, new GoogleAuthProvider());
  }

  signOut(): Promise<void> {
    return signOut(this.#auth);
  }

  idToken(): Promise<string | null> {
    const current = this.#auth.currentUser;
    return current ? current.getIdToken() : Promise.resolve(null);
  }
}
