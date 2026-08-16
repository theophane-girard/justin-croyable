import {
  skillContract,
  type CreateSkillPayload,
  type Skill,
  type SkillQuery,
  type UpdateSkillPayload,
} from '@justin-croyable/cv-contract';
import { Controller, Inject, Injectable, Module } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { asc, eq } from 'drizzle-orm';

import { type Database, DRIZZLE } from '../db/drizzle';
import { skills, tags, type SkillRecord, type TagRecord } from '../db/schema';
import { TagModule, toTag } from '../tags/tag.module';

type SkillWithTag = SkillRecord & { readonly tag: TagRecord };

const WITH_TAG = { tag: true } as const;

function toSkill(record: SkillWithTag): Skill {
  return {
    id: record.id,
    label: record.label,
    tagId: record.tagId,
    tag: toTag(record.tag),
    createdAt: record.createdAt.toISOString(),
  };
}

@Injectable()
export class SkillService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async list(query: SkillQuery): Promise<Skill[]> {
    const rows = await this.db.query.skills.findMany({
      where: query.tagId ? eq(skills.tagId, query.tagId) : undefined,
      with: WITH_TAG,
      orderBy: [asc(skills.label)],
    });
    return rows.map(toSkill);
  }

  async create(payload: CreateSkillPayload): Promise<Skill | null> {
    if (!(await this.#tagExists(payload.tagId))) {
      return null;
    }
    const [created] = await this.db
      .insert(skills)
      .values({ label: payload.label, tagId: payload.tagId })
      .returning();
    return this.#get(created.id);
  }

  async update(
    id: string,
    payload: UpdateSkillPayload,
  ): Promise<Skill | 'not-found' | 'unknown-tag'> {
    if (payload.tagId !== undefined && !(await this.#tagExists(payload.tagId))) {
      return 'unknown-tag';
    }
    const [updated] = await this.db
      .update(skills)
      .set({
        ...(payload.label !== undefined ? { label: payload.label } : {}),
        ...(payload.tagId !== undefined ? { tagId: payload.tagId } : {}),
        updatedAt: new Date(),
      })
      .where(eq(skills.id, id))
      .returning({ id: skills.id });
    if (!updated) {
      return 'not-found';
    }
    const skill = await this.#get(updated.id);
    return skill ?? 'not-found';
  }

  async remove(id: string): Promise<boolean> {
    const [deleted] = await this.db
      .delete(skills)
      .where(eq(skills.id, id))
      .returning({ id: skills.id });
    return Boolean(deleted);
  }

  async #get(id: string): Promise<Skill | null> {
    const record = await this.db.query.skills.findFirst({
      where: eq(skills.id, id),
      with: WITH_TAG,
    });
    return record ? toSkill(record) : null;
  }

  async #tagExists(tagId: string): Promise<boolean> {
    const tag = await this.db.query.tags.findFirst({ where: eq(tags.id, tagId) });
    return Boolean(tag);
  }
}

@Controller()
export class SkillController {
  constructor(private readonly skills: SkillService) {}

  @TsRestHandler(skillContract)
  async handler() {
    return tsRestHandler(skillContract, {
      list: async ({ query }) => ({ status: 200, body: await this.skills.list(query) }),
      create: async ({ body }) => {
        const created = await this.skills.create(body);
        if (!created) {
          return { status: 400, body: { message: 'Tag introuvable.' } };
        }
        return { status: 201, body: created };
      },
      update: async ({ params, body }) => {
        const outcome = await this.skills.update(params.id, body);
        if (outcome === 'not-found') {
          return { status: 404, body: { message: 'Compétence introuvable.' } };
        }
        if (outcome === 'unknown-tag') {
          return { status: 400, body: { message: 'Tag introuvable.' } };
        }
        return { status: 200, body: outcome };
      },
      remove: async ({ params }) => {
        const removed = await this.skills.remove(params.id);
        if (!removed) {
          return { status: 404, body: { message: 'Compétence introuvable.' } };
        }
        return { status: 200, body: { id: params.id } };
      },
    });
  }
}

@Module({
  imports: [TagModule],
  controllers: [SkillController],
  providers: [SkillService],
  exports: [SkillService],
})
export class SkillModule {}
