import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { GARDEN_ROLE, type Garden, type GardenRole } from '@justin-croyable/api-contract';

import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { UserStore } from './user-store';

const MANAGER_ROLES: ReadonlySet<GardenRole> = new Set([GARDEN_ROLE.owner, GARDEN_ROLE.coOwner]);
const WRITABLE_ROLES: ReadonlySet<GardenRole> = new Set([
  GARDEN_ROLE.owner,
  GARDEN_ROLE.coOwner,
  GARDEN_ROLE.tempEditorViewer,
  GARDEN_ROLE.tempEditorRevoked,
]);

@Injectable({ providedIn: 'root' })
export class GardenAccessStore {
  readonly #api = inject(ApiService);
  readonly #auth = inject(AuthService);
  readonly #users = inject(UserStore);

  readonly #gardens = signal<readonly Garden[]>([]);
  readonly #selectedId = signal<string | null>(null);

  readonly gardens = this.#gardens.asReadonly();

  readonly #personalId = computed(
    () => this.#gardens().find(garden => garden.role === GARDEN_ROLE.owner)?.id ?? null,
  );

  readonly #autoId = computed(() => {
    const defaultId = this.#users.defaultGardenId();
    if (defaultId && this.#gardens().some(garden => garden.id === defaultId)) {
      return defaultId;
    }
    return this.#personalId();
  });

  readonly activeId = computed(() => this.#selectedId() ?? this.#autoId());

  readonly active = computed<Garden | null>(() => {
    const id = this.activeId();
    return this.#gardens().find(garden => garden.id === id) ?? null;
  });

  readonly hasMultiple = computed(() => this.#gardens().length > 1);

  readonly canManageActive = computed(() => {
    const role = this.active()?.role;
    return role !== undefined && MANAGER_ROLES.has(role);
  });

  readonly canWriteActive = computed(() => {
    const role = this.active()?.role;
    return role !== undefined && WRITABLE_ROLES.has(role);
  });

  readonly activeIsDefault = computed(() => this.active()?.id === this.#users.defaultGardenId());

  constructor() {
    effect(() => {
      if (this.#auth.isAuthenticated()) {
        void this.reload();
        return;
      }
      this.#gardens.set([]);
      this.#selectedId.set(null);
    });
    effect(() => {
      const id = this.activeId();
      this.#api.setActiveGardenId(id && id !== this.#personalId() ? id : null);
    });
  }

  async reload(): Promise<void> {
    const response = await this.#api.listGardens();
    if (response.status === 200) {
      this.#gardens.set(response.body);
    }
  }

  setActive(gardenId: string): void {
    this.#selectedId.set(gardenId);
  }

  async setDefault(gardenId: string): Promise<boolean> {
    const succeeded = await this.#users.setDefaultGarden(gardenId);
    if (succeeded) {
      this.#selectedId.set(gardenId);
    }
    return succeeded;
  }

  async remove(gardenId: string): Promise<boolean> {
    const response = await this.#api.removeGarden(gardenId);
    if (response.status !== 200) {
      return false;
    }
    if (this.#selectedId() === gardenId) {
      this.#selectedId.set(null);
    }
    await this.reload();
    return true;
  }
}
