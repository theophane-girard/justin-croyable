import {
  harvestContract,
  type CreateHarvestPayload,
  type Harvest,
  type UpdateHarvestPayload,
} from '@justin-croyable/api-contract';
import { Controller, Inject, Injectable, Module, UseGuards } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { and, eq } from 'drizzle-orm';

import { CurrentUser } from '../auth/current-user.decorator';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { type Database, DRIZZLE } from '../db/drizzle';
import { harvests, type HarvestRecord, type UserRecord } from '../db/schema';

function toHarvest(record: HarvestRecord): Harvest {
  return {
    id: record.id,
    varietyId: record.varietyId,
    weightKg: record.weightKg,
    harvestedOn: record.harvestedOn.toISOString(),
    createdAt: record.createdAt.toISOString(),
  };
}

@Injectable()
export class HarvestService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async list(userId: string): Promise<Harvest[]> {
    const rows = await this.db.select().from(harvests).where(eq(harvests.userId, userId));
    return rows.map(toHarvest);
  }

  async create(userId: string, payload: CreateHarvestPayload): Promise<Harvest> {
    const [created] = await this.db
      .insert(harvests)
      .values({
        userId,
        varietyId: payload.varietyId,
        weightKg: payload.weightKg,
        harvestedOn: new Date(payload.harvestedOn),
      })
      .returning();
    return toHarvest(created);
  }

  async update(userId: string, id: string, payload: UpdateHarvestPayload): Promise<Harvest | null> {
    const [updated] = await this.db
      .update(harvests)
      .set({
        ...(payload.varietyId !== undefined ? { varietyId: payload.varietyId } : {}),
        ...(payload.weightKg !== undefined ? { weightKg: payload.weightKg } : {}),
        ...(payload.harvestedOn !== undefined
          ? { harvestedOn: new Date(payload.harvestedOn) }
          : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(harvests.id, id), eq(harvests.userId, userId)))
      .returning();
    return updated ? toHarvest(updated) : null;
  }

  async remove(userId: string, id: string): Promise<boolean> {
    const [deleted] = await this.db
      .delete(harvests)
      .where(and(eq(harvests.id, id), eq(harvests.userId, userId)))
      .returning({ id: harvests.id });
    return Boolean(deleted);
  }
}

@Controller()
@UseGuards(FirebaseAuthGuard)
export class HarvestController {
  constructor(private readonly harvests: HarvestService) {}

  @TsRestHandler(harvestContract)
  async handler(@CurrentUser() user: UserRecord) {
    return tsRestHandler(harvestContract, {
      list: async () => ({ status: 200, body: await this.harvests.list(user.id) }),
      create: async ({ body }) => ({ status: 201, body: await this.harvests.create(user.id, body) }),
      update: async ({ params, body }) => {
        const updated = await this.harvests.update(user.id, params.id, body);
        if (!updated) {
          return { status: 404, body: { message: 'Récolte introuvable.' } };
        }
        return { status: 200, body: updated };
      },
      remove: async ({ params }) => {
        const removed = await this.harvests.remove(user.id, params.id);
        if (!removed) {
          return { status: 404, body: { message: 'Récolte introuvable.' } };
        }
        return { status: 200, body: { id: params.id } };
      },
    });
  }
}

@Module({ controllers: [HarvestController], providers: [HarvestService] })
export class HarvestModule {}
