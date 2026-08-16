import { authContract } from '@justin-croyable/cv-contract';
import { Controller, Global, Module, Req } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';

import { FirebaseModule } from '../firebase/firebase.module';

import { AdminAuthService, extractBearerToken } from './admin-auth.service';

type IncomingRequest = { readonly headers: Record<string, string | string[] | undefined> };

@Controller()
export class AuthController {
  constructor(private readonly adminAuth: AdminAuthService) {}

  @TsRestHandler(authContract)
  async handler(@Req() request: IncomingRequest) {
    return tsRestHandler(authContract, {
      me: async () => {
        const token = extractBearerToken(request.headers['authorization']);
        if (!token) {
          return { status: 401 as const, body: { message: 'Authentification requise.' } };
        }
        const identity = await this.adminAuth.identify(token);
        if (!identity) {
          return { status: 401 as const, body: { message: 'Jeton Google invalide.' } };
        }
        return { status: 200 as const, body: identity };
      },
    });
  }
}

@Global()
@Module({
  imports: [FirebaseModule],
  controllers: [AuthController],
  providers: [AdminAuthService],
  exports: [AdminAuthService],
})
export class AuthModule {}
