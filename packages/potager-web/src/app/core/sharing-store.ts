import { effect, inject, Injectable, signal } from '@angular/core';
import { type GardenMember, type ShareableRole } from '@justin-croyable/api-contract';

import { ApiService } from './api.service';
import { GardenAccessStore } from './garden-access-store';

@Injectable({ providedIn: 'root' })
export class SharingStore {
  readonly #api = inject(ApiService);
  readonly #access = inject(GardenAccessStore);

  readonly #members = signal<readonly GardenMember[]>([]);
  readonly members = this.#members.asReadonly();
  readonly canManage = this.#access.canManageActive;

  constructor() {
    effect(() => {
      const garden = this.#access.active();
      if (garden && this.#access.canManageActive()) {
        void this.#reloadMembers(garden.id);
        return;
      }
      this.#members.set([]);
    });
  }

  async invite(email: string, role: ShareableRole): Promise<boolean> {
    const gardenId = this.#access.active()?.id;
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
    const gardenId = this.#access.active()?.id;
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
