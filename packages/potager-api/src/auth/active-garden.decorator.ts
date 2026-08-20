import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

import { type AuthenticatedRequest } from './auth.types';

const ACTIVE_GARDEN_HEADER = 'x-garden-id';

export const ActiveGardenId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string | null => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers[ACTIVE_GARDEN_HEADER];
    if (typeof header !== 'string' || header.trim() === '') {
      return null;
    }
    return header;
  },
);
