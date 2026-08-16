import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app/app.module';
import { type Env } from './config/env';

const GLOBAL_PREFIX = 'api';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get<ConfigService<Env, true>>(ConfigService);
  app.setGlobalPrefix(GLOBAL_PREFIX);
  const corsOrigins: (string | RegExp)[] = config
    .get('CORS_ORIGIN', { infer: true })
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);
  const corsOriginRegex = config.get('CORS_ORIGIN_REGEX', { infer: true });
  if (corsOriginRegex) {
    corsOrigins.push(new RegExp(corsOriginRegex));
  }
  app.enableCors({ origin: corsOrigins, credentials: true });
  const port = config.get('PORT', { infer: true });
  await app.listen(port);
  Logger.log(`🚀 API CV en écoute sur http://localhost:${port}/${GLOBAL_PREFIX}`);
}

bootstrap();
