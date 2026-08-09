import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

import { type AppAbility } from './ability';
import { type AuthenticatedRequest } from './auth.types';

export const CurrentAbility = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AppAbility => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.ability) {
      throw new Error('CurrentAbility requiert une route protégée par FirebaseAuthGuard.');
    }
    return request.ability;
  },
);
