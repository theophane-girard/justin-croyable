import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { GARDEN_ROLE, type Garden, type GardenRole } from '@justin-croyable/api-contract';

import { ApiService } from './api.service';
import { AuthService } from './auth.service';

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

  readonly #gardens = signal<readonly Garden[]>([]);
  readonly #activeId = signal<string | null>(null);

  readonly gardens = this.#gardens.asReadonly();

  readonly #personalId = computed(
    () => this.#gardens().find(garden => garden.role === GARDEN_ROLE.owner)?.id ?? null,
  );

  readonly activeId = computed(() => this.#activeId() ?? this.#personalId());

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

  constructor() {
    effect(() => {
      if (this.#auth.isAuthenticated()) {
        void this.reload();
        return;
      }
      this.#gardens.set([]);
      this.setActive(null);
    });
  }

  async reload(): Promise<void> {
    const response = await this.#api.listGardens();
    if (response.status === 200) {
      this.#gardens.set(response.body);
    }
  }

  setActive(gardenId: string | null): void {
    const personalId = this.#personalId();
    const isPersonal = gardenId === null || gardenId === personalId;
    this.#activeId.set(isPersonal ? null : gardenId);
    this.#api.setActiveGardenId(isPersonal ? null : gardenId);
  }
}
