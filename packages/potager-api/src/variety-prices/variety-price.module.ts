import {
  varietyPriceContract,
  type CreateVarietyPricePayload,
  type UpdateVarietyPricePayload,
  type VarietyPrice,
} from '@justin-croyable/api-contract';
import { Controller, Inject, Injectable, Module, UseGuards } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { eq } from 'drizzle-orm';

import { ACTION, type AppAbility, SUBJECT } from '../auth/ability';
import { CurrentAbility } from '../auth/current-ability.decorator';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { type Database, DRIZZLE } from '../db/drizzle';
import { varietyPrices, type VarietyPriceRecord } from '../db/schema';

import { RnmIngestionService } from './rnm/rnm-ingestion.service';
import { RnmScheduleController } from './rnm/rnm-schedule.controller';
import { RefreshTokenGuard } from './rnm/refresh-token.guard';

const ADMIN_ONLY = { message: 'Action réservée aux administrateurs.' };

function toVarietyPrice(record: VarietyPriceRecord): VarietyPrice {
  return {
    id: record.id,
    varietyId: record.varietyId,
    conventionalPricePerKg: record.conventionalPricePerKg,
    bioPricePerKg: record.bioPricePerKg,
    effectiveFrom: record.effectiveFrom.toISOString(),
    source: record.source,
    createdAt: record.createdAt.toISOString(),
  };
}

@Injectable()
export class VarietyPriceService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async list(): Promise<VarietyPrice[]> {
    const rows = await this.db.select().from(varietyPrices);
    return rows.map(toVarietyPrice);
  }

  async create(payload: CreateVarietyPricePayload): Promise<VarietyPrice> {
    const [created] = await this.db
      .insert(varietyPrices)
      .values({
        varietyId: payload.varietyId,
        conventionalPricePerKg: payload.conventionalPricePerKg,
        bioPricePerKg: payload.bioPricePerKg ?? null,
        effectiveFrom: new Date(payload.effectiveFrom),
        source: payload.source,
      })
      .returning();
    return toVarietyPrice(created);
  }

  async update(id: string, payload: UpdateVarietyPricePayload): Promise<VarietyPrice | null> {
    const [updated] = await this.db
      .update(varietyPrices)
      .set({
        ...(payload.varietyId !== undefined ? { varietyId: payload.varietyId } : {}),
        ...(payload.conventionalPricePerKg !== undefined
          ? { conventionalPricePerKg: payload.conventionalPricePerKg }
          : {}),
        ...(payload.bioPricePerKg !== undefined ? { bioPricePerKg: payload.bioPricePerKg } : {}),
        ...(payload.effectiveFrom !== undefined
          ? { effectiveFrom: new Date(payload.effectiveFrom) }
          : {}),
        ...(payload.source !== undefined ? { source: payload.source } : {}),
        updatedAt: new Date(),
      })
      .where(eq(varietyPrices.id, id))
      .returning();
    return updated ? toVarietyPrice(updated) : null;
  }

  async remove(id: string): Promise<boolean> {
    const [deleted] = await this.db
      .delete(varietyPrices)
      .where(eq(varietyPrices.id, id))
      .returning({ id: varietyPrices.id });
    return Boolean(deleted);
  }
}

@Controller()
@UseGuards(FirebaseAuthGuard)
export class VarietyPriceController {
  constructor(
    private readonly prices: VarietyPriceService,
    private readonly rnm: RnmIngestionService,
  ) {}

  @TsRestHandler(varietyPriceContract)
  async handler(@CurrentAbility() ability: AppAbility) {
    return tsRestHandler(varietyPriceContract, {
      list: async () => ({ status: 200, body: await this.prices.list() }),
      refresh: async () => {
        if (ability.cannot(ACTION.create, SUBJECT.varietyPrice)) {
          return { status: 403, body: ADMIN_ONLY };
        }
        try {
          return { status: 200, body: await this.rnm.refresh() };
        } catch (error) {
          const message = error instanceof Error ? error.message : "Échec de l'import RNM.";
          return { status: 502, body: { message } };
        }
      },
      create: async ({ body }) => {
        if (ability.cannot(ACTION.create, SUBJECT.varietyPrice)) {
          return { status: 403, body: ADMIN_ONLY };
        }
        return { status: 201, body: await this.prices.create(body) };
      },
      update: async ({ params, body }) => {
        if (ability.cannot(ACTION.update, SUBJECT.varietyPrice)) {
          return { status: 403, body: ADMIN_ONLY };
        }
        const updated = await this.prices.update(params.id, body);
        if (!updated) {
          return { status: 404, body: { message: 'Prix introuvable.' } };
        }
        return { status: 200, body: updated };
      },
      remove: async ({ params }) => {
        if (ability.cannot(ACTION.delete, SUBJECT.varietyPrice)) {
          return { status: 403, body: ADMIN_ONLY };
        }
        const removed = await this.prices.remove(params.id);
        if (!removed) {
          return { status: 404, body: { message: 'Prix introuvable.' } };
        }
        return { status: 200, body: { id: params.id } };
      },
    });
  }
}

@Module({
  controllers: [VarietyPriceController, RnmScheduleController],
  providers: [VarietyPriceService, RnmIngestionService, RefreshTokenGuard],
})
export class VarietyPriceModule {}
