import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

import { type UserRecord } from '../db/schema';

import { type AuthenticatedRequest } from './auth.types';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): UserRecord => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.user) {
      throw new Error("CurrentUser requiert une route protégée par FirebaseAuthGuard.");
    }
    return request.user;
  },
);
