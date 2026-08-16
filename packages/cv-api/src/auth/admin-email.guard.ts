import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { AdminAuthService, extractBearerToken } from './admin-auth.service';

const READ_ONLY_METHODS: ReadonlySet<string> = new Set(['GET', 'HEAD', 'OPTIONS']);

type GuardedRequest = {
  readonly method: string;
  readonly headers: Record<string, string | string[] | undefined>;
};

@Injectable()
export class AdminEmailGuard implements CanActivate {
  constructor(private readonly adminAuth: AdminAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') {
      return true;
    }
    const request = context.switchToHttp().getRequest<GuardedRequest>();
    if (READ_ONLY_METHODS.has(request.method)) {
      return true;
    }
    const token = extractBearerToken(request.headers['authorization']);
    if (!token) {
      throw new UnauthorizedException("Jeton d'authentification manquant.");
    }
    const identity = await this.adminAuth.identify(token);
    if (!identity) {
      throw new UnauthorizedException("Jeton d'authentification invalide.");
    }
    if (!identity.isAdmin) {
      throw new ForbiddenException('Ce compte Google n’est pas autorisé à modifier le CV.');
    }
    return true;
  }
}
