import { type RnmRefreshResult } from '@justin-croyable/api-contract';
import { Controller, Post, UseGuards } from '@nestjs/common';

import { ACTION, SUBJECT } from '../../auth/ability';
import { FirebaseAuthGuard } from '../../auth/firebase-auth.guard';
import { PoliciesGuard } from '../../auth/policies.guard';
import { RequirePermission } from '../../auth/require-permission.decorator';

import { RefreshTokenGuard } from './refresh-token.guard';
import { RnmIngestionService } from './rnm-ingestion.service';

@Controller()
export class RnmController {
  constructor(private readonly rnm: RnmIngestionService) {}

  @Post('variety-prices/refresh')
  @UseGuards(FirebaseAuthGuard, PoliciesGuard)
  @RequirePermission(ACTION.create, SUBJECT.varietyPrice)
  refresh(): Promise<RnmRefreshResult> {
    return this.rnm.refresh();
  }

  @Post('variety-prices/refresh-cron')
  @UseGuards(RefreshTokenGuard)
  refreshCron(): Promise<RnmRefreshResult> {
    return this.rnm.refresh();
  }
}
