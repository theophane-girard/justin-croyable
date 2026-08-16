import {
  tagContract,
  type CreateTagPayload,
  type Tag,
  type TagQuery,
  type UpdateTagPayload,
} from '@justin-croyable/cv-contract';
import { Controller, Inject, Injectable, Module } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { asc, eq } from 'drizzle-orm';

import { type Database, DRIZZLE } from '../db/drizzle';
import { skills, tags, type TagRecord } from '../db/schema';

export type TagRemovalOutcome = 'ok' | 'not-found' | 'in-use';

export function toTag(record: TagRecord): Tag {
  return {
    id: record.id,
    label: record.label,
    img: record.img,
    icon: record.icon,
    type: record.type,
    createdAt: record.createdAt.toISOString(),
  };
}

@Injectable()
export class TagService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async list(query: TagQuery): Promise<Tag[]> {
    const rows = await this.db.query.tags.findMany({
      where: query.type ? eq(tags.type, query.type) : undefined,
      orderBy: [asc(tags.type), asc(tags.label)],
    });
    return rows.map(toTag);
  }

  async get(id: string): Promise<Tag | null> {
    const record = await this.db.query.tags.findFirst({ where: eq(tags.id, id) });
    return record ? toTag(record) : null;
  }

  async create(payload: CreateTagPayload): Promise<Tag> {
    const [created] = await this.db
      .insert(tags)
      .values({
        label: payload.label,
        img: payload.img,
        icon: payload.icon,
        type: payload.type,
      })
      .returning();
    return toTag(created);
  }

  async update(id: string, payload: UpdateTagPayload): Promise<Tag | null> {
    const [updated] = await this.db
      .update(tags)
      .set({
        ...(payload.label !== undefined ? { label: payload.label } : {}),
        ...(payload.img !== undefined ? { img: payload.img } : {}),
        ...(payload.icon !== undefined ? { icon: payload.icon } : {}),
        ...(payload.type !== undefined ? { type: payload.type } : {}),
        updatedAt: new Date(),
      })
      .where(eq(tags.id, id))
      .returning();
    return updated ? toTag(updated) : null;
  }

  async remove(id: string): Promise<TagRemovalOutcome> {
    const existing = await this.db.query.tags.findFirst({ where: eq(tags.id, id) });
    if (!existing) {
      return 'not-found';
    }
    const usedBySkill = await this.db.query.skills.findFirst({ where: eq(skills.tagId, id) });
    if (usedBySkill) {
      return 'in-use';
    }
    await this.db.delete(tags).where(eq(tags.id, id));
    return 'ok';
  }
}

@Controller()
export class TagController {
  constructor(private readonly tags: TagService) {}

  @TsRestHandler(tagContract)
  async handler() {
    return tsRestHandler(tagContract, {
      list: async ({ query }) => ({ status: 200, body: await this.tags.list(query) }),
      get: async ({ params }) => {
        const tag = await this.tags.get(params.id);
        if (!tag) {
          return { status: 404, body: { message: 'Tag introuvable.' } };
        }
        return { status: 200, body: tag };
      },
      create: async ({ body }) => ({ status: 201, body: await this.tags.create(body) }),
      update: async ({ params, body }) => {
        const updated = await this.tags.update(params.id, body);
        if (!updated) {
          return { status: 404, body: { message: 'Tag introuvable.' } };
        }
        return { status: 200, body: updated };
      },
      remove: async ({ params }) => {
        const outcome = await this.tags.remove(params.id);
        if (outcome === 'not-found') {
          return { status: 404, body: { message: 'Tag introuvable.' } };
        }
        if (outcome === 'in-use') {
          return {
            status: 409,
            body: { message: 'Tag utilisé par au moins une compétence : détache-la d’abord.' },
          };
        }
        return { status: 200, body: { id: params.id } };
      },
    });
  }
}

@Module({
  controllers: [TagController],
  providers: [TagService],
  exports: [TagService],
})
export class TagModule {}
