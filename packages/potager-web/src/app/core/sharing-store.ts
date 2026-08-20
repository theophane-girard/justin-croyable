import { computed, effect, inject, Injectable, signal } from '@angular/core';
import {
  GARDEN_ROLE,
  type Garden,
  type GardenMember,
  type GardenRole,
  type ShareableRole,
} from '@justin-croyable/api-contract';

import { ApiService } from './api.service';
import { AuthService } from './auth.service';

const MANAGER_ROLES: ReadonlySet<GardenRole> = new Set([GARDEN_ROLE.owner, GARDEN_ROLE.coOwner]);

@Injectable({ providedIn: 'root' })
export class SharingStore {
  readonly #api = inject(ApiService);
  readonly #auth = inject(AuthService);

  readonly #garden = signal<Garden | null>(null);
  readonly #members = signal<readonly GardenMember[]>([]);

  readonly garden = this.#garden.asReadonly();
  readonly members = this.#members.asReadonly();

  readonly canManage = computed(() => {
    const role = this.#garden()?.role;
    return role !== undefined && MANAGER_ROLES.has(role);
  });

  constructor() {
    effect(() => {
      if (this.#auth.isAuthenticated()) {
        void this.reload();
        return;
      }
      this.#garden.set(null);
      this.#members.set([]);
    });
  }

  async reload(): Promise<void> {
    const response = await this.#api.currentGarden();
    if (response.status !== 200) {
      return;
    }
    this.#garden.set(response.body);
    await this.#reloadMembers(response.body.id);
  }

  async invite(email: string, role: ShareableRole): Promise<boolean> {
    const gardenId = this.#garden()?.id;
    if (!gardenId) {
      return false;
    }
    const response = await this.#api.inviteGardenMember(gardenId, { email, role });
    if (response.status !== 201) {
      return false;
    }
    await this.#reloadMembers(gardenId);
    return true;
  }

  async remove(memberId: string): Promise<boolean> {
    const gardenId = this.#garden()?.id;
    if (!gardenId) {
      return false;
    }
    const response = await this.#api.removeGardenMember(gardenId, memberId);
    if (response.status !== 200) {
      return false;
    }
    await this.#reloadMembers(gardenId);
    return true;
  }

  async #reloadMembers(gardenId: string): Promise<void> {
    const response = await this.#api.gardenMembers(gardenId);
    this.#members.set(response.status === 200 ? response.body : []);
  }
}
