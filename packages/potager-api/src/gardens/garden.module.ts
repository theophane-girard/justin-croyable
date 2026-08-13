import {
  gardenContract,
  GARDEN_ROLE,
  type Garden,
  type GardenRole,
} from '@justin-croyable/api-contract';
import { Controller, Inject, Injectable, Module, UseGuards } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { and, eq, or } from 'drizzle-orm';

import { CurrentUser } from '../auth/current-user.decorator';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { type Database, DRIZZLE } from '../db/drizzle';
import { gardenMembers, gardens, type GardenRecord, type UserRecord } from '../db/schema';

const PERSONAL_GARDEN_NAME = 'Mon potager';

export function effectiveRole(
  role: GardenRole,
  expiresAt: Date | null,
  now: Date,
): GardenRole | null {
  if (role !== GARDEN_ROLE.tempEditorViewer && role !== GARDEN_ROLE.tempEditorRevoked) {
    return role;
  }
  const expired = expiresAt !== null && expiresAt.getTime() <= now.getTime();
  if (!expired) {
    return role;
  }
  return role === GARDEN_ROLE.tempEditorViewer ? GARDEN_ROLE.viewer : null;
}

const WRITE_ROLES: ReadonlySet<GardenRole> = new Set([
  GARDEN_ROLE.owner,
  GARDEN_ROLE.coOwner,
  GARDEN_ROLE.tempEditorViewer,
  GARDEN_ROLE.tempEditorRevoked,
]);

export function roleCanWrite(role: GardenRole | null): boolean {
  return role !== null && WRITE_ROLES.has(role);
}

@Injectable()
export class GardenService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async currentGarden(user: UserRecord): Promise<GardenRecord> {
    const existing = await this.db.query.gardens.findFirst({
      where: eq(gardens.ownerUserId, user.id),
    });
    if (existing) {
      return existing;
    }
    const [created] = await this.db
      .insert(gardens)
      .values({ ownerUserId: user.id, name: PERSONAL_GARDEN_NAME })
      .returning();
    await this.db
      .insert(gardenMembers)
      .values({
        gardenId: created.id,
        userId: user.id,
        email: user.email,
        role: GARDEN_ROLE.owner,
      });
    return created;
  }

  async accessibleGardenIds(user: UserRecord): Promise<string[]> {
    const personal = await this.currentGarden(user);
    const memberships = await this.db
      .select({ gardenId: gardenMembers.gardenId, role: gardenMembers.role, expiresAt: gardenMembers.expiresAt })
      .from(gardenMembers)
      .where(or(eq(gardenMembers.userId, user.id), eq(gardenMembers.email, user.email)));
    const now = new Date();
    const shared = memberships
      .filter(member => effectiveRole(member.role, member.expiresAt, now) !== null)
      .map(member => member.gardenId);
    return Array.from(new Set([personal.id, ...shared]));
  }

  async roleFor(user: UserRecord, gardenId: string): Promise<GardenRole | null> {
    const garden = await this.db.query.gardens.findFirst({ where: eq(gardens.id, gardenId) });
    if (garden && garden.ownerUserId === user.id) {
      return GARDEN_ROLE.owner;
    }
    const membership = await this.db.query.gardenMembers.findFirst({
      where: and(
        eq(gardenMembers.gardenId, gardenId),
        or(eq(gardenMembers.userId, user.id), eq(gardenMembers.email, user.email)),
      ),
    });
    if (!membership) {
      return null;
    }
    return effectiveRole(membership.role, membership.expiresAt, new Date());
  }

  toGarden(record: GardenRecord, role: GardenRole): Garden {
    return {
      id: record.id,
      name: record.name,
      role,
      createdAt: record.createdAt.toISOString(),
    };
  }
}

@Controller()
@UseGuards(FirebaseAuthGuard)
export class GardenController {
  constructor(private readonly gardens: GardenService) {}

  @TsRestHandler(gardenContract)
  async handler(@CurrentUser() user: UserRecord) {
    return tsRestHandler(gardenContract, {
      current: async () => {
        const garden = await this.gardens.currentGarden(user);
        return { status: 200, body: this.gardens.toGarden(garden, GARDEN_ROLE.owner) };
      },
    });
  }
}

@Module({
  controllers: [GardenController],
  providers: [GardenService],
  exports: [GardenService],
})
export class GardenModule {}
