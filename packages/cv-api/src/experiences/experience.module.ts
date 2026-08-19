import {
  experienceContract,
  type CreateExperiencePayload,
  type Experience,
  type ExperienceQuery,
  type UpdateExperiencePayload,
} from '@justin-croyable/cv-contract';
import { Controller, Inject, Injectable, Module } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { desc, eq, inArray } from 'drizzle-orm';

import { type Database, DRIZZLE } from '../db/drizzle';
import {
  experienceTags,
  experiences,
  tags,
  type ExperienceRecord,
  type TagRecord,
} from '../db/schema';
import { TagModule, toTag } from '../tags/tag.module';

type ExperienceWithTags = ExperienceRecord & {
  readonly experienceTags: readonly { readonly tag: TagRecord }[];
};

export type ExperienceUpdateFailure = 'not-found' | 'unknown-tag' | 'invalid-dates';

const WITH_TAGS = { experienceTags: { with: { tag: true } } } as const;

const ORDER_BY_MOST_RECENT = [desc(experiences.startDate), desc(experiences.createdAt)];

function toExperience(record: ExperienceWithTags): Experience {
  return {
    id: record.id,
    type: record.type,
    title: record.title,
    description: record.description,
    startDate: record.startDate,
    endDate: record.endDate,
    tags: record.experienceTags
      .map(link => toTag(link.tag))
      .sort((left, right) => left.label.localeCompare(right.label)),
    createdAt: record.createdAt.toISOString(),
  };
}

@Injectable()
export class ExperienceService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async list(query: ExperienceQuery): Promise<Experience[]> {
    const rows = await this.db.query.experiences.findMany({
      where: query.type ? eq(experiences.type, query.type) : undefined,
      with: WITH_TAGS,
      orderBy: ORDER_BY_MOST_RECENT,
    });
    return rows.map(toExperience);
  }

  async get(id: string): Promise<Experience | null> {
    const record = await this.#findWithTags(id);
    return record ? toExperience(record) : null;
  }

  async create(payload: CreateExperiencePayload): Promise<Experience | null> {
    if (!(await this.#tagsExist(payload.tagIds))) {
      return null;
    }
    const created = await this.db.transaction(async tx => {
      const [experience] = await tx
        .insert(experiences)
        .values({
          type: payload.type,
          title: payload.title,
          description: payload.description,
          startDate: payload.startDate,
          endDate: payload.endDate,
        })
        .returning();
      await this.#replaceTags(tx, experience.id, payload.tagIds);
      return experience;
    });
    return this.get(created.id);
  }

  async update(
    id: string,
    payload: UpdateExperiencePayload,
  ): Promise<Experience | ExperienceUpdateFailure> {
    const existing = await this.db.query.experiences.findFirst({ where: eq(experiences.id, id) });
    if (!existing) {
      return 'not-found';
    }
    if (payload.tagIds && !(await this.#tagsExist(payload.tagIds))) {
      return 'unknown-tag';
    }
    const nextStartDate = payload.startDate ?? existing.startDate;
    const nextEndDate = payload.endDate === undefined ? existing.endDate : payload.endDate;
    if (nextEndDate !== null && nextEndDate < nextStartDate) {
      return 'invalid-dates';
    }
    await this.db.transaction(async tx => {
      await tx
        .update(experiences)
        .set({
          ...(payload.type !== undefined ? { type: payload.type } : {}),
          ...(payload.title !== undefined ? { title: payload.title } : {}),
          ...(payload.description !== undefined ? { description: payload.description } : {}),
          ...(payload.startDate !== undefined ? { startDate: payload.startDate } : {}),
          ...(payload.endDate !== undefined ? { endDate: payload.endDate } : {}),
          updatedAt: new Date(),
        })
        .where(eq(experiences.id, id));
      if (!payload.tagIds) {
        return;
      }
      await this.#replaceTags(tx, id, payload.tagIds);
    });
    const updated = await this.get(id);
    return updated ?? 'not-found';
  }

  async remove(id: string): Promise<boolean> {
    const [deleted] = await this.db
      .delete(experiences)
      .where(eq(experiences.id, id))
      .returning({ id: experiences.id });
    return Boolean(deleted);
  }

  async #findWithTags(id: string): Promise<ExperienceWithTags | undefined> {
    return this.db.query.experiences.findFirst({ where: eq(experiences.id, id), with: WITH_TAGS });
  }

  async #tagsExist(tagIds: readonly string[]): Promise<boolean> {
    const unique = Array.from(new Set(tagIds));
    if (unique.length === 0) {
      return true;
    }
    const found = await this.db.select({ id: tags.id }).from(tags).where(inArray(tags.id, unique));
    return found.length === unique.length;
  }

  async #replaceTags(
    tx: Parameters<Parameters<Database['transaction']>[0]>[0],
    experienceId: string,
    tagIds: readonly string[],
  ): Promise<void> {
    await tx.delete(experienceTags).where(eq(experienceTags.experienceId, experienceId));
    const unique = Array.from(new Set(tagIds));
    if (unique.length === 0) {
      return;
    }
    await tx.insert(experienceTags).values(unique.map(tagId => ({ experienceId, tagId })));
  }
}

@Controller()
export class ExperienceController {
  constructor(private readonly experiences: ExperienceService) {}

  @TsRestHandler(experienceContract)
  async handler() {
    return tsRestHandler(experienceContract, {
      list: async ({ query }) => ({ status: 200, body: await this.experiences.list(query) }),
      get: async ({ params }) => {
        const experience = await this.experiences.get(params.id);
        if (!experience) {
          return { status: 404, body: { message: 'Expérience introuvable.' } };
        }
        return { status: 200, body: experience };
      },
      create: async ({ body }) => {
        const created = await this.experiences.create(body);
        if (!created) {
          return { status: 400, body: { message: 'Un ou plusieurs tags sont introuvables.' } };
        }
        return { status: 201, body: created };
      },
      update: async ({ params, body }) => {
        const outcome = await this.experiences.update(params.id, body);
        if (outcome === 'not-found') {
          return { status: 404, body: { message: 'Expérience introuvable.' } };
        }
        if (outcome === 'unknown-tag') {
          return { status: 400, body: { message: 'Un ou plusieurs tags sont introuvables.' } };
        }
        if (outcome === 'invalid-dates') {
          return {
            status: 400,
            body: { message: 'La date de fin doit être postérieure ou égale à la date de début.' },
          };
        }
        return { status: 200, body: outcome };
      },
      remove: async ({ params }) => {
        const removed = await this.experiences.remove(params.id);
        if (!removed) {
          return { status: 404, body: { message: 'Expérience introuvable.' } };
        }
        return { status: 200, body: { id: params.id } };
      },
    });
  }
}

@Module({
  imports: [TagModule],
  controllers: [ExperienceController],
  providers: [ExperienceService],
  exports: [ExperienceService],
})
export class ExperienceModule {}
