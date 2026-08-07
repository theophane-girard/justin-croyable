import { Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { initializeApp } from 'firebase/app';
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

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly #auth: Auth = getAuth(initializeApp(FIREBASE_CONFIG));

  readonly #user$ = new Observable<User | null>(subscriber =>
    onIdTokenChanged(this.#auth, user => subscriber.next(user)),
  );

  readonly user = toSignal(this.#user$, { initialValue: this.#auth.currentUser });

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
