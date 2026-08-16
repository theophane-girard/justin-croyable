import { inject, Injectable } from '@angular/core';
import {
  apiContract,
  type CreateExperiencePayload,
  type CreateSkillPayload,
  type CreateTagPayload,
  type ExperienceQuery,
  type SkillQuery,
  type TagQuery,
  type UpdateExperiencePayload,
  type UpdateSkillPayload,
  type UpdateTagPayload,
  type UpsertProfilePayload,
} from '@justin-croyable/cv-contract';
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
    return this.#client.auth.me();
  }

  getProfile() {
    return this.#client.profile.get();
  }

  upsertProfile(body: UpsertProfilePayload) {
    return this.#client.profile.upsert({ body });
  }

  listTags(query: TagQuery = {}) {
    return this.#client.tags.list({ query });
  }

  createTag(body: CreateTagPayload) {
    return this.#client.tags.create({ body });
  }

  updateTag(id: string, body: UpdateTagPayload) {
    return this.#client.tags.update({ params: { id }, body });
  }

  removeTag(id: string) {
    return this.#client.tags.remove({ params: { id } });
  }

  listExperiences(query: ExperienceQuery = {}) {
    return this.#client.experiences.list({ query });
  }

  createExperience(body: CreateExperiencePayload) {
    return this.#client.experiences.create({ body });
  }

  updateExperience(id: string, body: UpdateExperiencePayload) {
    return this.#client.experiences.update({ params: { id }, body });
  }

  removeExperience(id: string) {
    return this.#client.experiences.remove({ params: { id } });
  }

  listSkills(query: SkillQuery = {}) {
    return this.#client.skills.list({ query });
  }

  createSkill(body: CreateSkillPayload) {
    return this.#client.skills.create({ body });
  }

  updateSkill(id: string, body: UpdateSkillPayload) {
    return this.#client.skills.update({ params: { id }, body });
  }

  removeSkill(id: string) {
    return this.#client.skills.remove({ params: { id } });
  }
}
