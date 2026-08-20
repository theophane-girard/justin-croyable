import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app/app.module';
import {
  corsOriginHandler,
  FIREBASE_HOSTING_SITES,
  type CorsOriginRules,
} from './config/cors-origin';
import { type Env } from './config/env';

const GLOBAL_PREFIX = 'api';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get<ConfigService<Env, true>>(ConfigService);
  app.setGlobalPrefix(GLOBAL_PREFIX);
  const corsOriginRegex = config.get('CORS_ORIGIN_REGEX', { infer: true });
  const corsRules: CorsOriginRules = {
    allowedOrigins: config
      .get('CORS_ORIGIN', { infer: true })
      .split(',')
      .map(origin => origin.trim())
      .filter(Boolean),
    hostingSites: FIREBASE_HOSTING_SITES,
    extraOriginPattern: corsOriginRegex ? new RegExp(corsOriginRegex) : null,
  };
  app.enableCors({ origin: corsOriginHandler(corsRules), credentials: true });
  const port = config.get('PORT', { infer: true });
  await app.listen(port);
  Logger.log(`🚀 API en écoute sur http://localhost:${port}/${GLOBAL_PREFIX}`);
}

bootstrap();
