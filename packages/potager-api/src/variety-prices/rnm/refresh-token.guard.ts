import { timingSafeEqual } from 'node:crypto';

import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { type Env } from '../../config/env';

const HEADER_NAME = 'x-refresh-token';

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  constructor(private readonly config: ConfigService<Env, true>) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get('RNM_REFRESH_TOKEN', { infer: true });
    if (!expected) {
      return false;
    }
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
    }>();
    const header = request.headers[HEADER_NAME];
    const provided = Array.isArray(header) ? header.at(0) : header;
    if (!provided) {
      return false;
    }
    const expectedBytes = Buffer.from(expected);
    const providedBytes = Buffer.from(provided);
    return (
      expectedBytes.length === providedBytes.length &&
      timingSafeEqual(expectedBytes, providedBytes)
    );
  }
}
