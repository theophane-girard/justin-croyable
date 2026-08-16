import { effect, inject, signal } from '@angular/core';

import { SonnerService } from '@justin-croyable/design-system';

import { ApiService } from './api.service';
import { SessionStore } from './session-store';

export type ApiResponse = { readonly status: number; readonly body: unknown };

const HTTP_STATUS = {
  ok: 200,
  created: 201,
  badRequest: 400,
  unauthorized: 401,
  forbidden: 403,
  notFound: 404,
  conflict: 409,
} as const;

const FAILURE_MESSAGE: Readonly<Record<number, string>> = {
  [HTTP_STATUS.unauthorized]: 'Session expirée : reconnecte-toi.',
  [HTTP_STATUS.forbidden]: "Ce compte Google n'est pas autorisé à modifier le CV.",
  [HTTP_STATUS.notFound]: 'Élément introuvable : il a peut-être été supprimé.',
};

const DEFAULT_FAILURE_MESSAGE = "L'enregistrement a échoué.";

function messageOf(response: ApiResponse): string {
  const known = FAILURE_MESSAGE[response.status];
  if (known) {
    return known;
  }
  const body = response.body;
  if (typeof body === 'object' && body !== null && 'message' in body) {
    const { message } = body as { readonly message: unknown };
    if (typeof message === 'string') {
      return message;
    }
  }
  return DEFAULT_FAILURE_MESSAGE;
}

export abstract class CollectionStore<T extends { readonly id: string }> {
  protected readonly api = inject(ApiService);
  protected readonly sonner = inject(SonnerService);
  readonly #session = inject(SessionStore);

  readonly #entries = signal<readonly T[]>([]);
  readonly #loading = signal(false);

  readonly entries = this.#entries.asReadonly();
  readonly loading = this.#loading.asReadonly();

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
      const response = await this.fetchAll();
      if (response.status === HTTP_STATUS.ok) {
        this.#entries.set(response.body as readonly T[]);
      }
    } finally {
      this.#loading.set(false);
    }
  }

  protected abstract fetchAll(): Promise<ApiResponse>;

  protected async runCreate(request: () => Promise<ApiResponse>): Promise<boolean> {
    const response = await request();
    if (response.status !== HTTP_STATUS.created) {
      this.sonner.error(messageOf(response));
      return false;
    }
    this.#entries.update(entries => [...entries, response.body as T]);
    return true;
  }

  protected async runUpdate(id: string, request: () => Promise<ApiResponse>): Promise<boolean> {
    const response = await request();
    if (response.status !== HTTP_STATUS.ok) {
      this.sonner.error(messageOf(response));
      return false;
    }
    const updated = response.body as T;
    this.#entries.update(entries => entries.map(entry => (entry.id === id ? updated : entry)));
    return true;
  }

  protected async runRemove(id: string, request: () => Promise<ApiResponse>): Promise<boolean> {
    const response = await request();
    if (response.status !== HTTP_STATUS.ok) {
      this.sonner.error(messageOf(response));
      return false;
    }
    this.#entries.update(entries => entries.filter(entry => entry.id !== id));
    return true;
  }
}
