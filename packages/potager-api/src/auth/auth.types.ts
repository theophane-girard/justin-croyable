import { type UserRecord } from '../db/schema';

import { type AppAbility } from './ability';

export type AuthenticatedRequest = {
  headers: { authorization?: string };
  user?: UserRecord;
  ability?: AppAbility;
};
