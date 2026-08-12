import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { type AuthenticatedRequest } from './auth.types';
import { POLICIES_KEY, type RequiredPolicy } from './require-permission.decorator';

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const policy = this.reflector.getAllAndOverride<RequiredPolicy | undefined>(POLICIES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!policy) {
      return true;
    }
    const { ability } = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!ability || ability.cannot(policy.action, policy.subject)) {
      throw new ForbiddenException('Action non autorisée.');
    }
    return true;
  }
}
