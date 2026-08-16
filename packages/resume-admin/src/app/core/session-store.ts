import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { type Session } from '@justin-croyable/cv-contract';

import { ApiService } from './api.service';
import { AuthService } from './auth.service';

export const ACCESS_STATE = {
  pending: 'pending',
  anonymous: 'anonymous',
  forbidden: 'forbidden',
  granted: 'granted',
} as const;

export type AccessState = (typeof ACCESS_STATE)[keyof typeof ACCESS_STATE];

@Injectable({ providedIn: 'root' })
export class SessionStore {
  readonly #api = inject(ApiService);
  readonly #auth = inject(AuthService);

  readonly #session = signal<Session | null>(null);
  readonly #checked = signal(false);

  readonly session = this.#session.asReadonly();
  readonly isAdmin = computed(() => this.#session()?.isAdmin === true);

  readonly access = computed<AccessState>(() => {
    if (!this.#auth.ready()) {
      return ACCESS_STATE.pending;
    }
    if (!this.#auth.isAuthenticated()) {
      return ACCESS_STATE.anonymous;
    }
    if (!this.#checked()) {
      return ACCESS_STATE.pending;
    }
    return this.isAdmin() ? ACCESS_STATE.granted : ACCESS_STATE.forbidden;
  });

  constructor() {
    effect(() => {
      if (this.#auth.isAuthenticated()) {
        void this.reload();
        return;
      }
      this.#session.set(null);
      this.#checked.set(false);
    });
  }

  async reload(): Promise<void> {
    const response = await this.#api.me();
    this.#session.set(response.status === 200 ? response.body : null);
    this.#checked.set(true);
  }
}
