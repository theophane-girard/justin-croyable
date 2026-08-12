import { type RnmRefreshResult } from '@justin-croyable/api-contract';
import { Controller, Post, UseGuards } from '@nestjs/common';

import { AdminGuard } from '../../auth/admin.guard';
import { FirebaseAuthGuard } from '../../auth/firebase-auth.guard';

import { RefreshTokenGuard } from './refresh-token.guard';
import { RnmIngestionService } from './rnm-ingestion.service';

@Controller()
export class RnmController {
  constructor(private readonly rnm: RnmIngestionService) {}

  @Post('variety-prices/refresh')
  @UseGuards(FirebaseAuthGuard, AdminGuard)
  refresh(): Promise<RnmRefreshResult> {
    return this.rnm.refresh();
  }

  @Post('variety-prices/refresh-cron')
  @UseGuards(RefreshTokenGuard)
  refreshCron(): Promise<RnmRefreshResult> {
    return this.rnm.refresh();
  }
}
