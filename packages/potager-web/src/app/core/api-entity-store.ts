import { effect, inject, signal } from '@angular/core';

import { ApiService } from './api.service';
import { AuthService } from './auth.service';

type ApiResponse = { readonly status: number; readonly body: unknown };

export abstract class ApiEntityStore<T extends { readonly id: string }> {
  protected readonly api = inject(ApiService);
  readonly #auth = inject(AuthService);

  readonly #entries = signal<readonly T[]>([]);
  readonly #loading = signal(false);
  readonly #loaded = signal(false);

  readonly entries = this.#entries.asReadonly();
  readonly loading = this.#loading.asReadonly();
  readonly loaded = this.#loaded.asReadonly();

  constructor() {
    effect(() => {
      this.api.activeGardenId();
      if (this.#auth.isAuthenticated()) {
        void this.reload();
        return;
      }
      this.#entries.set([]);
      this.#loaded.set(false);
    });
  }

  async reload(): Promise<void> {
    this.#loading.set(true);
    try {
      const response = await this.fetchAll();
      if (response.status === 200) {
        this.#entries.set(response.body as readonly T[]);
        this.#loaded.set(true);
      }
    } finally {
      this.#loading.set(false);
    }
  }

  protected abstract fetchAll(): Promise<ApiResponse>;

  protected async createEntry(request: () => Promise<ApiResponse>): Promise<void> {
    const response = await request();
    if (response.status === 201) {
      this.#entries.update(entries => [...entries, response.body as T]);
    }
  }

  protected async updateEntry(id: string, request: () => Promise<ApiResponse>): Promise<void> {
    const response = await request();
    if (response.status === 200) {
      const updated = response.body as T;
      this.#entries.update(entries => entries.map(entry => (entry.id === id ? updated : entry)));
    }
  }

  protected async removeEntry(id: string, request: () => Promise<ApiResponse>): Promise<void> {
    const response = await request();
    if (response.status === 200) {
      this.#entries.update(entries => entries.filter(entry => entry.id !== id));
    }
  }
}
