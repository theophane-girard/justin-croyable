import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { type Auth, type DecodedIdToken } from 'firebase-admin/auth';

import { FIREBASE_AUTH } from '../firebase/firebase';

import { AbilityFactory } from './ability';
import { type AuthenticatedRequest } from './auth.types';
import { UserService } from './user.service';

const BEARER_PREFIX = 'Bearer ';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(
    @Inject(FIREBASE_AUTH) private readonly firebaseAuth: Auth,
    private readonly users: UserService,
    private readonly abilities: AbilityFactory,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.#extractToken(request);
    if (!token) {
      throw new UnauthorizedException("Jeton d'authentification manquant.");
    }
    const decoded = await this.#verify(token);
    const user = await this.users.findOrCreate({
      uid: decoded.uid,
      email: decoded.email ?? '',
      displayName: decoded.name ?? null,
      photoUrl: decoded.picture ?? null,
    });
    request.user = user;
    request.ability = this.abilities.createForUser(user);
    return true;
  }

  #extractToken(request: AuthenticatedRequest): string | null {
    const header = request.headers.authorization;
    if (!header || !header.startsWith(BEARER_PREFIX)) {
      return null;
    }
    return header.slice(BEARER_PREFIX.length).trim() || null;
  }

  async #verify(token: string): Promise<DecodedIdToken> {
    try {
      return await this.firebaseAuth.verifyIdToken(token);
    } catch {
      throw new UnauthorizedException("Jeton d'authentification invalide.");
    }
  }
}
