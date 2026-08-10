import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { USER_ROLE, type UserProfile } from '@justin-croyable/api-contract';

import { ApiService } from './api.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class UserStore {
  readonly #api = inject(ApiService);
  readonly #auth = inject(AuthService);

  readonly #profile = signal<UserProfile | null>(null);
  readonly profile = this.#profile.asReadonly();

  readonly isAdmin = computed(() => this.#profile()?.role === USER_ROLE.admin);

  constructor() {
    effect(() => {
      if (this.#auth.isAuthenticated()) {
        void this.reload();
        return;
      }
      this.#profile.set(null);
    });
  }

  async reload(): Promise<void> {
    const response = await this.#api.me();
    if (response.status === 200) {
      this.#profile.set(response.body);
    }
  }
}
