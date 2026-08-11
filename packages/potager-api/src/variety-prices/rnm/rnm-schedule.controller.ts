import { type RnmRefreshResult } from '@justin-croyable/api-contract';
import { Controller, Post, UseGuards } from '@nestjs/common';

import { RefreshTokenGuard } from './refresh-token.guard';
import { RnmIngestionService } from './rnm-ingestion.service';

@Controller()
export class RnmScheduleController {
  constructor(private readonly rnm: RnmIngestionService) {}

  @Post('variety-prices/refresh-cron')
  @UseGuards(RefreshTokenGuard)
  refresh(): Promise<RnmRefreshResult> {
    return this.rnm.refresh();
  }
}
