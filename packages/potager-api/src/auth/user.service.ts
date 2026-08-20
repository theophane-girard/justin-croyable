import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { type Database, DRIZZLE } from '../db/drizzle';
import { users, type UserRecord } from '../db/schema';

export type FirebaseIdentity = {
  readonly uid: string;
  readonly email: string;
  readonly displayName: string | null;
  readonly photoUrl: string | null;
};

@Injectable()
export class UserService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async findOrCreate(identity: FirebaseIdentity): Promise<UserRecord> {
    const existing = await this.#findByFirebaseUid(identity.uid);
    if (existing) {
      return existing;
    }
    const [created] = await this.db
      .insert(users)
      .values({
        firebaseUid: identity.uid,
        email: identity.email,
        displayName: identity.displayName,
        photoUrl: identity.photoUrl,
      })
      .returning();
    return created;
  }

  async updateProfile(userId: string, displayName: string): Promise<UserRecord> {
    const [updated] = await this.db
      .update(users)
      .set({ displayName, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async setDefaultGarden(userId: string, gardenId: string | null): Promise<UserRecord> {
    const [updated] = await this.db
      .update(users)
      .set({ defaultGardenId: gardenId, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  #findByFirebaseUid(uid: string): Promise<UserRecord | undefined> {
    return this.db.query.users.findFirst({ where: eq(users.firebaseUid, uid) });
  }
}
