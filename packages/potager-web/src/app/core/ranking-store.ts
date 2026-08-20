import { effect, inject, Injectable, signal } from '@angular/core';
import { type GardenRankingEntry } from '@justin-croyable/api-contract';

import { ApiService } from './api.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class RankingStore {
  readonly #api = inject(ApiService);
  readonly #auth = inject(AuthService);

  readonly #entries = signal<readonly GardenRankingEntry[]>([]);
  readonly #loaded = signal(false);

  readonly entries = this.#entries.asReadonly();
  readonly loaded = this.#loaded.asReadonly();

  constructor() {
    effect(() => {
      if (this.#auth.isAuthenticated()) {
        void this.reload();
        return;
      }
      this.#entries.set([]);
      this.#loaded.set(false);
    });
  }

  async reload(): Promise<void> {
    const response = await this.#api.gardenRankings();
    if (response.status === 200) {
      this.#entries.set(response.body);
      this.#loaded.set(true);
    }
  }
}
