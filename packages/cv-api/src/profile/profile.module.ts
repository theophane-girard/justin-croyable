import {
  profileContract,
  type Profile,
  type UpsertProfilePayload,
} from '@justin-croyable/cv-contract';
import { Controller, Inject, Injectable, Module } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { asc, eq } from 'drizzle-orm';

import { type Database, DRIZZLE } from '../db/drizzle';
import { profiles, type ProfileRecord } from '../db/schema';

function toProfile(record: ProfileRecord): Profile {
  return {
    id: record.id,
    firstname: record.firstname,
    lastname: record.lastname,
    dateOfBirth: record.dateOfBirth,
    description: record.description,
    phoneNumber: record.phoneNumber,
    driverLicence: record.driverLicence,
    email: record.email,
    website: record.website,
    linkedin: record.linkedin,
    streetName: record.streetName,
    city: record.city,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

@Injectable()
export class ProfileService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async get(): Promise<Profile | null> {
    const record = await this.#current();
    return record ? toProfile(record) : null;
  }

  async upsert(payload: UpsertProfilePayload): Promise<Profile> {
    const existing = await this.#current();
    if (!existing) {
      const [created] = await this.db.insert(profiles).values(payload).returning();
      return toProfile(created);
    }
    const [updated] = await this.db
      .update(profiles)
      .set({ ...payload, updatedAt: new Date() })
      .where(eq(profiles.id, existing.id))
      .returning();
    return toProfile(updated);
  }

  async #current(): Promise<ProfileRecord | undefined> {
    return this.db.query.profiles.findFirst({ orderBy: [asc(profiles.createdAt)] });
  }
}

@Controller()
export class ProfileController {
  constructor(private readonly profiles: ProfileService) {}

  @TsRestHandler(profileContract)
  async handler() {
    return tsRestHandler(profileContract, {
      get: async () => {
        const profile = await this.profiles.get();
        if (!profile) {
          return { status: 404, body: { message: 'Profil non renseigné.' } };
        }
        return { status: 200, body: profile };
      },
      upsert: async ({ body }) => ({ status: 200, body: await this.profiles.upsert(body) }),
    });
  }
}

@Module({
  controllers: [ProfileController],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}
