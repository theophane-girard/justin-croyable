import { Injectable } from '@angular/core';
import {
  type CreateSkillPayload,
  type Skill,
  type UpdateSkillPayload,
} from '@justin-croyable/cv-contract';

import { type ApiResponse, CollectionStore } from './collection-store';

@Injectable({ providedIn: 'root' })
export class SkillStore extends CollectionStore<Skill> {
  protected fetchAll(): Promise<ApiResponse> {
    return this.api.listSkills();
  }

  create(payload: CreateSkillPayload): Promise<boolean> {
    return this.runCreate(() => this.api.createSkill(payload));
  }

  update(id: string, payload: UpdateSkillPayload): Promise<boolean> {
    return this.runUpdate(id, () => this.api.updateSkill(id, payload));
  }

  remove(id: string): Promise<boolean> {
    return this.runRemove(id, () => this.api.removeSkill(id));
  }
}
