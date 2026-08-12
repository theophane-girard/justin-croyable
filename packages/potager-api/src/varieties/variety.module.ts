import {
  varietyContract,
  type CreateVarietyPayload,
  type Variety,
} from '@justin-croyable/api-contract';
import { Controller, Inject, Injectable, Module, UseGuards } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { and, eq, inArray, isNull, or, sql } from 'drizzle-orm';

import { CurrentUser } from '../auth/current-user.decorator';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { type Database, DRIZZLE } from '../db/drizzle';
import { harvests, plants, varieties, type UserRecord, type VarietyRecord } from '../db/schema';
import { GardenModule, GardenService, roleCanWrite } from '../gardens/garden.module';

function toVariety(record: VarietyRecord): Variety {
  return {
    id: record.id,
    gardenId: record.gardenId ?? null,
    slug: record.slug ?? null,
    cropId: record.cropId,
    label: record.label,
    referenceVarietyId: record.referenceVarietyId ?? null,
    createdAt: record.createdAt.toISOString(),
  };
}

function normalizeLabel(label: string): string {
  return label.trim().toLowerCase();
}

@Injectable()
export class VarietyService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly gardens: GardenService,
  ) {}

  async list(user: UserRecord): Promise<Variety[]> {
    const gardenIds = await this.gardens.accessibleGardenIds(user);
    const rows = await this.db
      .select()
      .from(varieties)
      .where(or(isNull(varieties.gardenId), inArray(varieties.gardenId, gardenIds)));
    return rows.map(toVariety);
  }

  async create(user: UserRecord, payload: CreateVarietyPayload): Promise<Variety | null> {
    const reference = await this.db.query.varieties.findFirst({
      where: eq(varieties.id, payload.referenceVarietyId),
    });
    if (!reference || reference.gardenId !== null) {
      return null;
    }
    const garden = await this.gardens.currentGarden(user);
    const duplicate = await this.db.query.varieties.findFirst({
      where: and(
        eq(varieties.gardenId, garden.id),
        sql`lower(trim(${varieties.label})) = ${normalizeLabel(payload.label)}`,
      ),
    });
    if (duplicate) {
      return toVariety(duplicate);
    }
    const [created] = await this.db
      .insert(varieties)
      .values({
        gardenId: garden.id,
        slug: null,
        cropId: reference.cropId,
        label: payload.label.trim(),
        referenceVarietyId: reference.id,
      })
      .returning();
    return toVariety(created);
  }

  async remove(user: UserRecord, id: string): Promise<'ok' | 'not-found' | 'forbidden' | 'in-use'> {
    const variety = await this.db.query.varieties.findFirst({ where: eq(varieties.id, id) });
    if (!variety) {
      return 'not-found';
    }
    if (variety.gardenId === null) {
      return 'forbidden';
    }
    const role = await this.gardens.roleFor(user, variety.gardenId);
    if (!roleCanWrite(role)) {
      return 'forbidden';
    }
    if (await this.#isReferenced(id)) {
      return 'in-use';
    }
    await this.db.delete(varieties).where(eq(varieties.id, id));
    return 'ok';
  }

  async #isReferenced(varietyId: string): Promise<boolean> {
    const plant = await this.db.query.plants.findFirst({ where: eq(plants.varietyId, varietyId) });
    if (plant) {
      return true;
    }
    const harvest = await this.db.query.harvests.findFirst({
      where: eq(harvests.varietyId, varietyId),
    });
    return Boolean(harvest);
  }
}

@Controller()
@UseGuards(FirebaseAuthGuard)
export class VarietyController {
  constructor(private readonly varieties: VarietyService) {}

  @TsRestHandler(varietyContract)
  async handler(@CurrentUser() user: UserRecord) {
    return tsRestHandler(varietyContract, {
      list: async () => ({ status: 200, body: await this.varieties.list(user) }),
      create: async ({ body }) => {
        const created = await this.varieties.create(user, body);
        if (!created) {
          return { status: 400, body: { message: 'Variété de référence invalide.' } };
        }
        return { status: 201, body: created };
      },
      remove: async ({ params }) => {
        const outcome = await this.varieties.remove(user, params.id);
        if (outcome === 'not-found') {
          return { status: 404, body: { message: 'Variété introuvable.' } };
        }
        if (outcome === 'forbidden') {
          return { status: 403, body: { message: 'Suppression non autorisée.' } };
        }
        if (outcome === 'in-use') {
          return { status: 403, body: { message: 'Variété utilisée par des récoltes ou plants.' } };
        }
        return { status: 200, body: { id: params.id } };
      },
    });
  }
}

@Module({
  imports: [GardenModule],
  controllers: [VarietyController],
  providers: [VarietyService],
})
export class VarietyModule {}
