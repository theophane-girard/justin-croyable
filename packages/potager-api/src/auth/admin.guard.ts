import { USER_ROLE } from '@justin-croyable/api-contract';
import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { type AuthenticatedRequest } from './auth.types';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (request.user?.role !== USER_ROLE.admin) {
      throw new ForbiddenException('Action réservée aux administrateurs.');
    }
    return true;
  }
}
