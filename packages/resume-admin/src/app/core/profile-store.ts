import { effect, inject, Injectable, signal } from '@angular/core';
import { type Profile, type UpsertProfilePayload } from '@justin-croyable/cv-contract';

import { SonnerService } from '@justin-croyable/design-system';

import { ApiService } from './api.service';
import { SessionStore } from './session-store';

const PROFILE_SAVE_ERROR = "L'enregistrement du profil a échoué.";
const PROFILE_SAVED = 'Profil enregistré.';

@Injectable({ providedIn: 'root' })
export class ProfileStore {
  readonly #api = inject(ApiService);
  readonly #sonner = inject(SonnerService);
  readonly #session = inject(SessionStore);

  readonly #profile = signal<Profile | null>(null);
  readonly #loading = signal(false);
  readonly #saving = signal(false);

  readonly profile = this.#profile.asReadonly();
  readonly loading = this.#loading.asReadonly();
  readonly saving = this.#saving.asReadonly();

  constructor() {
    effect(() => {
      if (!this.#session.isAdmin()) {
        return;
      }
      void this.reload();
    });
  }

  async reload(): Promise<void> {
    this.#loading.set(true);
    try {
      const response = await this.#api.getProfile();
      this.#profile.set(response.status === 200 ? response.body : null);
    } finally {
      this.#loading.set(false);
    }
  }

  async save(payload: UpsertProfilePayload): Promise<boolean> {
    this.#saving.set(true);
    try {
      const response = await this.#api.upsertProfile(payload);
      if (response.status !== 200) {
        this.#sonner.error(PROFILE_SAVE_ERROR);
        return false;
      }
      this.#profile.set(response.body);
      this.#sonner.success(PROFILE_SAVED);
      return true;
    } finally {
      this.#saving.set(false);
    }
  }
}
