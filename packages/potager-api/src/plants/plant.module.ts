import {
  plantContract,
  type CreatePlantPayload,
  type Plant,
  type UpdatePlantPayload,
} from '@justin-croyable/api-contract';
import { Controller, Inject, Injectable, Module, UseGuards } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { and, eq } from 'drizzle-orm';

import { ActiveGardenId } from '../auth/active-garden.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { type Database, DRIZZLE } from '../db/drizzle';
import { GardenModule, GardenService } from '../gardens/garden.module';
import { plants, type PlantRecord, type UserRecord } from '../db/schema';

function toPlant(record: PlantRecord): Plant {
  return {
    id: record.id,
    cropId: record.cropId,
    varietyId: record.varietyId ?? null,
    quantity: record.quantity,
    createdAt: record.createdAt.toISOString(),
  };
}

@Injectable()
export class PlantService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async list(userId: string): Promise<Plant[]> {
    const rows = await this.db.select().from(plants).where(eq(plants.userId, userId));
    return rows.map(toPlant);
  }

  async create(userId: string, payload: CreatePlantPayload): Promise<Plant> {
    const [created] = await this.db
      .insert(plants)
      .values({
        userId,
        cropId: payload.cropId,
        varietyId: payload.varietyId ?? null,
        quantity: payload.quantity,
      })
      .returning();
    return toPlant(created);
  }

  async update(userId: string, id: string, payload: UpdatePlantPayload): Promise<Plant | null> {
    const [updated] = await this.db
      .update(plants)
      .set({
        ...(payload.cropId !== undefined ? { cropId: payload.cropId } : {}),
        ...(payload.varietyId !== undefined ? { varietyId: payload.varietyId } : {}),
        ...(payload.quantity !== undefined ? { quantity: payload.quantity } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(plants.id, id), eq(plants.userId, userId)))
      .returning();
    return updated ? toPlant(updated) : null;
  }

  async remove(userId: string, id: string): Promise<boolean> {
    const [deleted] = await this.db
      .delete(plants)
      .where(and(eq(plants.id, id), eq(plants.userId, userId)))
      .returning({ id: plants.id });
    return Boolean(deleted);
  }
}

@Controller()
@UseGuards(FirebaseAuthGuard)
export class PlantController {
  constructor(
    private readonly plants: PlantService,
    private readonly gardens: GardenService,
  ) {}

  @TsRestHandler(plantContract)
  async handler(
    @CurrentUser() user: UserRecord,
    @ActiveGardenId() activeGardenId: string | null,
  ) {
    return tsRestHandler(plantContract, {
      list: async () => {
        const ownerId = await this.gardens.resolveDataOwnerId(user, activeGardenId);
        return { status: 200, body: ownerId ? await this.plants.list(ownerId) : [] };
      },
      create: async ({ body }) => ({ status: 201, body: await this.plants.create(user.id, body) }),
      update: async ({ params, body }) => {
        const updated = await this.plants.update(user.id, params.id, body);
        if (!updated) {
          return { status: 404, body: { message: 'Plant introuvable.' } };
        }
        return { status: 200, body: updated };
      },
      remove: async ({ params }) => {
        const removed = await this.plants.remove(user.id, params.id);
        if (!removed) {
          return { status: 404, body: { message: 'Plant introuvable.' } };
        }
        return { status: 200, body: { id: params.id } };
      },
    });
  }
}

@Module({ imports: [GardenModule], controllers: [PlantController], providers: [PlantService] })
export class PlantModule {}
