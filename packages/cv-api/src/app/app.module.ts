import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { AdminEmailGuard } from '../auth/admin-email.guard';
import { AuthModule } from '../auth/auth.module';
import { validateEnv } from '../config/env';
import { CvModule } from '../cv/cv.module';
import { DbModule } from '../db/db.module';
import { ExperienceModule } from '../experiences/experience.module';
import { FirebaseModule } from '../firebase/firebase.module';
import { ProfileModule } from '../profile/profile.module';
import { SkillModule } from '../skills/skill.module';
import { TagModule } from '../tags/tag.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';

const RATE_LIMIT_TTL_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 100;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
      envFilePath: ['.env', 'packages/cv-api/.env'],
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: RATE_LIMIT_TTL_MS, limit: RATE_LIMIT_MAX_REQUESTS }],
    }),
    DbModule,
    FirebaseModule,
    AuthModule,
    TagModule,
    ExperienceModule,
    SkillModule,
    ProfileModule,
    CvModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: AdminEmailGuard },
  ],
})
export class AppModule {}
