import { inject, Injectable } from '@angular/core';
import { apiContract } from '@justin-croyable/api-contract';
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
}
