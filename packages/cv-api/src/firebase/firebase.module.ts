import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { type Env } from '../config/env';

import { createFirebaseAuth, FIREBASE_AUTH } from './firebase';

@Global()
@Module({
  providers: [
    {
      provide: FIREBASE_AUTH,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) =>
        createFirebaseAuth({
          projectId: config.get('FIREBASE_PROJECT_ID', { infer: true }),
          clientEmail: config.get('FIREBASE_CLIENT_EMAIL', { infer: true }),
          privateKey: config.get('FIREBASE_PRIVATE_KEY', { infer: true }),
        }),
    },
  ],
  exports: [FIREBASE_AUTH],
})
export class FirebaseModule {}
