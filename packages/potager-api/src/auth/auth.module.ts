import { Global, Module } from '@nestjs/common';

import { GardenModule } from '../gardens/garden.module';

import { AbilityFactory } from './ability';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Global()
@Module({
  imports: [GardenModule],
  controllers: [UserController],
  providers: [UserService, FirebaseAuthGuard, AbilityFactory],
  exports: [UserService, FirebaseAuthGuard, AbilityFactory],
})
export class AuthModule {}
