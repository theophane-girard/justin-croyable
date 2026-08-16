import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type Auth } from 'firebase-admin/auth';

import { type Env } from '../config/env';
import { FIREBASE_AUTH } from '../firebase/firebase';

const BEARER_PREFIX = 'Bearer ';

export type AdminIdentity = {
  readonly email: string;
  readonly displayName: string | null;
  readonly photoUrl: string | null;
  readonly isAdmin: boolean;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function extractBearerToken(header: string | string[] | undefined): string | null {
  const value = Array.isArray(header) ? header.at(0) : header;
  if (!value || !value.startsWith(BEARER_PREFIX)) {
    return null;
  }
  return value.slice(BEARER_PREFIX.length).trim() || null;
}

@Injectable()
export class AdminAuthService {
  constructor(
    @Inject(FIREBASE_AUTH) private readonly firebaseAuth: Auth,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async identify(token: string): Promise<AdminIdentity | null> {
    const decoded = await this.#verify(token);
    if (!decoded?.email || decoded.email_verified !== true) {
      return null;
    }
    const adminEmail = this.config.get('RESUME_ADMIN_EMAIL', { infer: true });
    return {
      email: decoded.email,
      displayName: decoded.name ?? null,
      photoUrl: decoded.picture ?? null,
      isAdmin: normalizeEmail(decoded.email) === normalizeEmail(adminEmail),
    };
  }

  async #verify(token: string) {
    try {
      return await this.firebaseAuth.verifyIdToken(token);
    } catch {
      return null;
    }
  }
}
