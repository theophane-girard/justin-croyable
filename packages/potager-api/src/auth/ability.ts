import { USER_ROLE } from '@justin-croyable/api-contract';
import {
  AbilityBuilder,
  createMongoAbility,
  type MongoAbility,
} from '@casl/ability';
import { Injectable } from '@nestjs/common';

import { type UserRecord } from '../db/schema';

export const ACTION = {
  manage: 'manage',
  create: 'create',
  read: 'read',
  update: 'update',
  delete: 'delete',
} as const;

export type Action = (typeof ACTION)[keyof typeof ACTION];

export const SUBJECT = {
  user: 'User',
  harvest: 'Harvest',
  plant: 'Plant',
  expense: 'Expense',
} as const;

export type SubjectName = (typeof SUBJECT)[keyof typeof SUBJECT];

type OwnedSubject = { readonly userId: string };

export type AppSubject = 'all' | SubjectName | OwnedSubject;

export type AppAbility = MongoAbility<[Action, AppSubject]>;

@Injectable()
export class AbilityFactory {
  createForUser(user: UserRecord): AppAbility {
    const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);
    if (user.role === USER_ROLE.admin) {
      can(ACTION.manage, 'all');
      return build();
    }
    can(ACTION.manage, 'all', { userId: user.id });
    return build();
  }
}
