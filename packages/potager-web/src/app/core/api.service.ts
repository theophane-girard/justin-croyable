import { inject, Injectable } from '@angular/core';
import {
  apiContract,
  type CreateExpensePayload,
  type CreateHarvestPayload,
  type CreatePlantPayload,
  type CreateVarietyPayload,
  type CreateVarietyPricePayload,
  type UpdateExpensePayload,
  type UpdateHarvestPayload,
  type UpdatePlantPayload,
  type UpdateVarietyPricePayload,
} from '@justin-croyable/api-contract';
import { type ApiFetcherArgs, initClient, tsRestFetchApi } from '@ts-rest/core';

import { API_BASE_URL } from './app-config';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ApiService {
  readonly #auth = inject(AuthService);

  readonly #client = initClient(apiContract, {
    baseUrl: `${API_BASE_URL}/api`,
    baseHeaders: {},
    api: async (args: ApiFetcherArgs) => {
      const token = await this.#auth.idToken();
      const headers = token ? { ...args.headers, authorization: `Bearer ${token}` } : args.headers;
      return tsRestFetchApi({ ...args, headers });
    },
  });

  me() {
    return this.#client.users.me();
  }

  updateProfile(displayName: string) {
    return this.#client.users.updateProfile({ body: { displayName } });
  }

  listHarvests() {
    return this.#client.harvests.list();
  }

  createHarvest(body: CreateHarvestPayload) {
    return this.#client.harvests.create({ body });
  }

  updateHarvest(id: string, body: UpdateHarvestPayload) {
    return this.#client.harvests.update({ params: { id }, body });
  }

  removeHarvest(id: string) {
    return this.#client.harvests.remove({ params: { id } });
  }

  listPlants() {
    return this.#client.plants.list();
  }

  createPlant(body: CreatePlantPayload) {
    return this.#client.plants.create({ body });
  }

  updatePlant(id: string, body: UpdatePlantPayload) {
    return this.#client.plants.update({ params: { id }, body });
  }

  removePlant(id: string) {
    return this.#client.plants.remove({ params: { id } });
  }

  listExpenses() {
    return this.#client.expenses.list();
  }

  createExpense(body: CreateExpensePayload) {
    return this.#client.expenses.create({ body });
  }

  updateExpense(id: string, body: UpdateExpensePayload) {
    return this.#client.expenses.update({ params: { id }, body });
  }

  removeExpense(id: string) {
    return this.#client.expenses.remove({ params: { id } });
  }

  listVarieties() {
    return this.#client.varieties.list();
  }

  createVariety(body: CreateVarietyPayload) {
    return this.#client.varieties.create({ body });
  }

  removeVariety(id: string) {
    return this.#client.varieties.remove({ params: { id } });
  }

  currentGarden() {
    return this.#client.gardens.current();
  }

  listVarietyPrices() {
    return this.#client.varietyPrices.list();
  }

  createVarietyPrice(body: CreateVarietyPricePayload) {
    return this.#client.varietyPrices.create({ body });
  }

  updateVarietyPrice(id: string, body: UpdateVarietyPricePayload) {
    return this.#client.varietyPrices.update({ params: { id }, body });
  }

  removeVarietyPrice(id: string) {
    return this.#client.varietyPrices.remove({ params: { id } });
  }

  async refreshVarietyPricesFromRnm(): Promise<{ readonly ok: boolean }> {
    const token = await this.#auth.idToken();
    const response = await fetch(`${API_BASE_URL}/api/variety-prices/refresh`, {
      method: 'POST',
      headers: token ? { authorization: `Bearer ${token}` } : {},
    });
    return { ok: response.ok };
  }
}
