import { Module } from '@nestjs/common';

import { AbilityFactory } from './ability';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  controllers: [UserController],
  providers: [UserService, FirebaseAuthGuard, AbilityFactory],
  exports: [UserService, AbilityFactory],
})
export class AuthModule {}
