import { Controller, UseGuards } from '@nestjs/common';
import { userContract, type UserProfile } from '@justin-croyable/api-contract';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';

import { type UserRecord } from '../db/schema';
import { GardenService } from '../gardens/garden.module';

import { CurrentUser } from './current-user.decorator';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { UserService } from './user.service';

function toProfile(user: UserRecord): UserProfile {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    photoUrl: user.photoUrl,
    role: user.role,
    defaultGardenId: user.defaultGardenId ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

@Controller()
@UseGuards(FirebaseAuthGuard)
export class UserController {
  constructor(
    private readonly users: UserService,
    private readonly gardens: GardenService,
  ) {}

  @TsRestHandler(userContract)
  async handler(@CurrentUser() user: UserRecord) {
    return tsRestHandler(userContract, {
      me: async () => ({ status: 200, body: toProfile(user) }),
      updateProfile: async ({ body }) => {
        const updated = await this.users.updateProfile(user.id, body.displayName);
        return { status: 200, body: toProfile(updated) };
      },
      setDefaultGarden: async ({ body }) => {
        if (body.gardenId !== null && (await this.gardens.roleFor(user, body.gardenId)) === null) {
          return { status: 400, body: { message: 'Jardin inaccessible.' } };
        }
        const updated = await this.users.setDefaultGarden(user.id, body.gardenId);
        return { status: 200, body: toProfile(updated) };
      },
    });
  }
}
