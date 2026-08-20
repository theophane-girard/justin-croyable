import { type UserRecord } from '../db/schema';

import { type AppAbility } from './ability';

export type AuthenticatedRequest = {
  headers: { authorization?: string; 'x-garden-id'?: string };
  user?: UserRecord;
  ability?: AppAbility;
};
