import {
  gardenContract,
  GARDEN_ROLE,
  type Garden,
  type GardenMember,
  type GardenRole,
  type InviteMemberPayload,
  type UpdateMemberPayload,
} from '@justin-croyable/api-contract';
import { Controller, Inject, Injectable, Module, UseGuards } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { and, eq, or, sql } from 'drizzle-orm';

import { CurrentUser } from '../auth/current-user.decorator';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { type Database, DRIZZLE } from '../db/drizzle';
import {
  expenses,
  gardenMembers,
  gardens,
  harvests,
  plants,
  users,
  type GardenMemberRecord,
  type GardenRecord,
  type UserRecord,
} from '../db/schema';

const PERSONAL_GARDEN_NAME = 'Mon potager';

function toMember(record: GardenMemberRecord): GardenMember {
  return {
    id: record.id,
    gardenId: record.gardenId,
    email: record.email,
    userId: record.userId ?? null,
    role: record.role,
    expiresAt: record.expiresAt ? record.expiresAt.toISOString() : null,
    createdAt: record.createdAt.toISOString(),
  };
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function membershipOfUser(user: UserRecord) {
  return or(
    eq(gardenMembers.userId, user.id),
    sql`lower(trim(${gardenMembers.email})) = ${normalizeEmail(user.email)}`,
  );
}

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

const MANAGE_ROLES: ReadonlySet<GardenRole> = new Set([GARDEN_ROLE.owner, GARDEN_ROLE.coOwner]);

export function roleCanManageMembers(role: GardenRole | null): boolean {
  return role !== null && MANAGE_ROLES.has(role);
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
      .where(membershipOfUser(user));
    const now = new Date();
    const shared = memberships
      .filter(member => effectiveRole(member.role, member.expiresAt, now) !== null)
      .map(member => member.gardenId);
    return Array.from(new Set([personal.id, ...shared]));
  }

  async listAccessibleGardens(user: UserRecord): Promise<Garden[]> {
    const personal = await this.currentGarden(user);
    const memberships = await this.db.query.gardenMembers.findMany({
      where: membershipOfUser(user),
    });
    const now = new Date();
    const shared = await Promise.all(
      memberships
        .filter(member => member.gardenId !== personal.id)
        .map(async member => {
          const role = effectiveRole(member.role, member.expiresAt, now);
          if (role === null) {
            return null;
          }
          const record = await this.db.query.gardens.findFirst({
            where: eq(gardens.id, member.gardenId),
          });
          if (!record) {
            return null;
          }
          const owner = await this.db.query.users.findFirst({
            where: eq(users.id, record.ownerUserId),
          });
          return this.toGarden(record, role, owner?.email ?? null);
        }),
    );
    return [
      this.toGarden(personal, GARDEN_ROLE.owner),
      ...shared.filter((garden): garden is Garden => garden !== null),
    ];
  }

  async removeForUser(
    user: UserRecord,
    gardenId: string,
  ): Promise<'ok' | 'not-found' | 'last'> {
    const role = await this.roleFor(user, gardenId);
    if (role === null) {
      return 'not-found';
    }
    const accessible = await this.accessibleGardenIds(user);
    if (accessible.length <= 1) {
      return 'last';
    }
    const garden = await this.db.query.gardens.findFirst({ where: eq(gardens.id, gardenId) });
    if (!garden) {
      return 'not-found';
    }
    if (garden.ownerUserId === user.id) {
      await this.#deleteOwnedGarden(garden);
      return 'ok';
    }
    await this.db
      .delete(gardenMembers)
      .where(
        and(
          eq(gardenMembers.gardenId, gardenId),
          membershipOfUser(user),
        ),
      );
    return 'ok';
  }

  async #deleteOwnedGarden(garden: GardenRecord): Promise<void> {
    await this.db.delete(harvests).where(eq(harvests.userId, garden.ownerUserId));
    await this.db.delete(plants).where(eq(plants.userId, garden.ownerUserId));
    await this.db.delete(expenses).where(eq(expenses.userId, garden.ownerUserId));
    await this.db.delete(gardens).where(eq(gardens.id, garden.id));
  }

  async resolveDataOwnerId(user: UserRecord, activeGardenId: string | null): Promise<string | null> {
    if (activeGardenId === null) {
      return user.id;
    }
    const garden = await this.db.query.gardens.findFirst({
      where: eq(gardens.id, activeGardenId),
    });
    if (!garden) {
      return null;
    }
    const role = await this.roleFor(user, activeGardenId);
    return role === null ? null : garden.ownerUserId;
  }

  async roleFor(user: UserRecord, gardenId: string): Promise<GardenRole | null> {
    const garden = await this.db.query.gardens.findFirst({ where: eq(gardens.id, gardenId) });
    if (garden && garden.ownerUserId === user.id) {
      return GARDEN_ROLE.owner;
    }
    const membership = await this.db.query.gardenMembers.findFirst({
      where: and(
        eq(gardenMembers.gardenId, gardenId),
        membershipOfUser(user),
      ),
    });
    if (!membership) {
      return null;
    }
    return effectiveRole(membership.role, membership.expiresAt, new Date());
  }

  toGarden(record: GardenRecord, role: GardenRole, ownerEmail: string | null = null): Garden {
    return {
      id: record.id,
      name: record.name,
      role,
      ownerEmail,
      createdAt: record.createdAt.toISOString(),
    };
  }

  async listMembers(
    user: UserRecord,
    gardenId: string,
  ): Promise<GardenMember[] | 'not-found' | 'forbidden'> {
    const manager = await this.#authorizeManagement(user, gardenId);
    if (typeof manager === 'string') {
      return manager;
    }
    const rows = await this.db
      .select()
      .from(gardenMembers)
      .where(eq(gardenMembers.gardenId, gardenId));
    return rows.map(toMember);
  }

  async invite(
    user: UserRecord,
    gardenId: string,
    payload: InviteMemberPayload,
  ): Promise<GardenMember | 'not-found' | 'forbidden' | 'duplicate'> {
    const manager = await this.#authorizeManagement(user, gardenId);
    if (typeof manager === 'string') {
      return manager;
    }
    const email = normalizeEmail(payload.email);
    const existing = await this.db.query.gardenMembers.findFirst({
      where: and(
        eq(gardenMembers.gardenId, gardenId),
        sql`lower(trim(${gardenMembers.email})) = ${email}`,
      ),
    });
    if (existing) {
      return 'duplicate';
    }
    const targetUser = await this.db.query.users.findFirst({ where: eq(users.email, email) });
    const [created] = await this.db
      .insert(gardenMembers)
      .values({ gardenId, userId: targetUser?.id ?? null, email, role: payload.role })
      .returning();
    return toMember(created);
  }

  async updateMember(
    user: UserRecord,
    gardenId: string,
    memberId: string,
    payload: UpdateMemberPayload,
  ): Promise<GardenMember | 'not-found' | 'forbidden'> {
    const manager = await this.#authorizeManagement(user, gardenId);
    if (typeof manager === 'string') {
      return manager;
    }
    const member = await this.#findMember(gardenId, memberId);
    if (!member) {
      return 'not-found';
    }
    if (this.#isOwnerMember(member, manager)) {
      return 'forbidden';
    }
    const [updated] = await this.db
      .update(gardenMembers)
      .set({ role: payload.role, updatedAt: new Date() })
      .where(eq(gardenMembers.id, memberId))
      .returning();
    return toMember(updated);
  }

  async removeMember(
    user: UserRecord,
    gardenId: string,
    memberId: string,
  ): Promise<'ok' | 'not-found' | 'forbidden'> {
    const manager = await this.#authorizeManagement(user, gardenId);
    if (typeof manager === 'string') {
      return manager;
    }
    const member = await this.#findMember(gardenId, memberId);
    if (!member) {
      return 'not-found';
    }
    if (this.#isOwnerMember(member, manager)) {
      return 'forbidden';
    }
    await this.db.delete(gardenMembers).where(eq(gardenMembers.id, memberId));
    return 'ok';
  }

  async #authorizeManagement(
    user: UserRecord,
    gardenId: string,
  ): Promise<GardenRecord | 'not-found' | 'forbidden'> {
    const garden = await this.db.query.gardens.findFirst({ where: eq(gardens.id, gardenId) });
    if (!garden) {
      return 'not-found';
    }
    const role = await this.roleFor(user, gardenId);
    if (!roleCanManageMembers(role)) {
      return 'forbidden';
    }
    return garden;
  }

  #findMember(gardenId: string, memberId: string): Promise<GardenMemberRecord | undefined> {
    return this.db.query.gardenMembers.findFirst({
      where: and(eq(gardenMembers.id, memberId), eq(gardenMembers.gardenId, gardenId)),
    });
  }

  #isOwnerMember(member: GardenMemberRecord, garden: GardenRecord): boolean {
    return member.role === GARDEN_ROLE.owner || member.userId === garden.ownerUserId;
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
      list: async () => ({ status: 200, body: await this.gardens.listAccessibleGardens(user) }),
      remove: async ({ params }) => {
        const outcome = await this.gardens.removeForUser(user, params.id);
        if (outcome === 'not-found') {
          return { status: 404, body: { message: 'Jardin introuvable.' } };
        }
        if (outcome === 'last') {
          return { status: 400, body: { message: 'Impossible de supprimer votre dernier jardin.' } };
        }
        return { status: 200, body: { id: params.id } };
      },
      members: async ({ params }) => {
        const outcome = await this.gardens.listMembers(user, params.id);
        if (outcome === 'not-found') {
          return { status: 404, body: { message: 'Jardin introuvable.' } };
        }
        if (outcome === 'forbidden') {
          return { status: 403, body: { message: 'Gestion des membres non autorisée.' } };
        }
        return { status: 200, body: outcome };
      },
      invite: async ({ params, body }) => {
        const outcome = await this.gardens.invite(user, params.id, body);
        if (outcome === 'not-found') {
          return { status: 404, body: { message: 'Jardin introuvable.' } };
        }
        if (outcome === 'forbidden') {
          return { status: 403, body: { message: 'Gestion des membres non autorisée.' } };
        }
        if (outcome === 'duplicate') {
          return { status: 400, body: { message: 'Ce membre a déjà accès à ce jardin.' } };
        }
        return { status: 201, body: outcome };
      },
      updateMember: async ({ params, body }) => {
        const outcome = await this.gardens.updateMember(user, params.id, params.memberId, body);
        if (outcome === 'not-found') {
          return { status: 404, body: { message: 'Membre introuvable.' } };
        }
        if (outcome === 'forbidden') {
          return { status: 403, body: { message: 'Modification non autorisée.' } };
        }
        return { status: 200, body: outcome };
      },
      removeMember: async ({ params }) => {
        const outcome = await this.gardens.removeMember(user, params.id, params.memberId);
        if (outcome === 'not-found') {
          return { status: 404, body: { message: 'Membre introuvable.' } };
        }
        if (outcome === 'forbidden') {
          return { status: 403, body: { message: 'Suppression non autorisée.' } };
        }
        return { status: 200, body: { id: params.memberId } };
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
