import { SetMetadata } from '@nestjs/common';

import { type Action, type AppSubject } from './ability';

export const POLICIES_KEY = 'required-policy';

export type RequiredPolicy = {
  readonly action: Action;
  readonly subject: AppSubject;
};

export const RequirePermission = (action: Action, subject: AppSubject) =>
  SetMetadata(POLICIES_KEY, { action, subject } satisfies RequiredPolicy);
