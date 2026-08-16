import { createHash, timingSafeEqual } from 'node:crypto';

import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { type Env } from '../config/env';

const BEARER_PREFIX = 'Bearer ';
const READ_ONLY_METHODS: ReadonlySet<string> = new Set(['GET', 'HEAD', 'OPTIONS']);

type GuardedRequest = {
  readonly method: string;
  readonly headers: Record<string, string | string[] | undefined>;
};

function digest(value: string): Buffer {
  return createHash('sha256').update(value).digest();
}

@Injectable()
export class AdminTokenGuard implements CanActivate {
  constructor(private readonly config: ConfigService<Env, true>) {}

  canActivate(context: ExecutionContext): boolean {
    if (context.getType() !== 'http') {
      return true;
    }
    const request = context.switchToHttp().getRequest<GuardedRequest>();
    if (READ_ONLY_METHODS.has(request.method)) {
      return true;
    }
    const provided = this.#extractToken(request);
    if (!provided) {
      throw new UnauthorizedException("Jeton d'administration manquant.");
    }
    const expected = this.config.get('ADMIN_TOKEN', { infer: true });
    if (!timingSafeEqual(digest(expected), digest(provided))) {
      throw new UnauthorizedException("Jeton d'administration invalide.");
    }
    return true;
  }

  #extractToken(request: GuardedRequest): string | null {
    const header = request.headers['authorization'];
    const value = Array.isArray(header) ? header.at(0) : header;
    if (!value || !value.startsWith(BEARER_PREFIX)) {
      return null;
    }
    return value.slice(BEARER_PREFIX.length).trim() || null;
  }
}
