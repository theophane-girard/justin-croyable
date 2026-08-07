import { type UserRecord } from '../db/schema';

export type AuthenticatedRequest = {
  headers: { authorization?: string };
  user?: UserRecord;
};
