import { Injectable } from '@angular/core';
import {
  type CreateExperiencePayload,
  type Experience,
  type UpdateExperiencePayload,
} from '@justin-croyable/cv-contract';

import { type ApiResponse, CollectionStore } from './collection-store';

@Injectable({ providedIn: 'root' })
export class ExperienceStore extends CollectionStore<Experience> {
  protected fetchAll(): Promise<ApiResponse> {
    return this.api.listExperiences();
  }

  create(payload: CreateExperiencePayload): Promise<boolean> {
    return this.runCreate(() => this.api.createExperience(payload));
  }

  update(id: string, payload: UpdateExperiencePayload): Promise<boolean> {
    return this.runUpdate(id, () => this.api.updateExperience(id, payload));
  }

  remove(id: string): Promise<boolean> {
    return this.runRemove(id, () => this.api.removeExperience(id));
  }
}
