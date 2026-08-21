import { timingSafeEqual } from 'node:crypto';

import { type CanActivate, type ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { type Env } from '../../config/env';

const HEADER_NAME = 'x-refresh-token';

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  readonly #logger = new Logger(RefreshTokenGuard.name);

  constructor(private readonly config: ConfigService<Env, true>) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get('RNM_REFRESH_TOKEN', { infer: true });
    if (!expected) {
      this.#logger.warn('Refresh RNM refusé : RNM_REFRESH_TOKEN absent de la configuration.');
      return false;
    }
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
    }>();
    const header = request.headers[HEADER_NAME];
    const provided = Array.isArray(header) ? header.at(0) : header;
    if (!provided) {
      this.#logger.warn(`Refresh RNM refusé : en-tête ${HEADER_NAME} absent.`);
      return false;
    }
    const expectedBytes = Buffer.from(expected);
    const providedBytes = Buffer.from(provided);
    const matches =
      expectedBytes.length === providedBytes.length &&
      timingSafeEqual(expectedBytes, providedBytes);
    if (!matches) {
      this.#logger.warn(`Refresh RNM refusé : en-tête ${HEADER_NAME} invalide.`);
    }
    return matches;
  }
}
