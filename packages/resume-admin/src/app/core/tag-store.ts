import { computed, Injectable } from '@angular/core';
import {
  type CreateTagPayload,
  type Tag,
  type UpdateTagPayload,
} from '@justin-croyable/cv-contract';

import { type ApiResponse, CollectionStore } from './collection-store';

@Injectable({ providedIn: 'root' })
export class TagStore extends CollectionStore<Tag> {
  readonly types = computed(() =>
    Array.from(new Set(this.entries().map(tag => tag.type))).sort((left, right) =>
      left.localeCompare(right, 'fr'),
    ),
  );

  readonly byId = computed(() => new Map(this.entries().map(tag => [tag.id, tag])));

  protected fetchAll(): Promise<ApiResponse> {
    return this.api.listTags();
  }

  create(payload: CreateTagPayload): Promise<boolean> {
    return this.runCreate(() => this.api.createTag(payload));
  }

  update(id: string, payload: UpdateTagPayload): Promise<boolean> {
    return this.runUpdate(id, () => this.api.updateTag(id, payload));
  }

  remove(id: string): Promise<boolean> {
    return this.runRemove(id, () => this.api.removeTag(id));
  }
}
