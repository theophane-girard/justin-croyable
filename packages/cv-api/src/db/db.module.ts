import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { type Env } from '../config/env';

import { createDatabase, DRIZZLE } from './drizzle';

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) =>
        createDatabase(config.get('DATABASE_URL', { infer: true })),
    },
  ],
  exports: [DRIZZLE],
})
export class DbModule {}
