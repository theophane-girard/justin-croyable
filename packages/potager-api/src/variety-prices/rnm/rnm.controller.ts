import { type RnmRefreshResult } from '@justin-croyable/api-contract';
import { BadGatewayException, Controller, HttpCode, Logger, Post, UseGuards } from '@nestjs/common';

import { ACTION, SUBJECT } from '../../auth/ability';
import { FirebaseAuthGuard } from '../../auth/firebase-auth.guard';
import { PoliciesGuard } from '../../auth/policies.guard';
import { RequirePermission } from '../../auth/require-permission.decorator';

import { RefreshTokenGuard } from './refresh-token.guard';
import { RnmIngestionService } from './rnm-ingestion.service';

@Controller()
export class RnmController {
  readonly #logger = new Logger(RnmController.name);

  constructor(private readonly rnm: RnmIngestionService) {}

  @Post('variety-prices/refresh')
  @HttpCode(200)
  @UseGuards(FirebaseAuthGuard, PoliciesGuard)
  @RequirePermission(ACTION.create, SUBJECT.varietyPrice)
  refresh(): Promise<RnmRefreshResult> {
    return this.#run();
  }

  @Post('variety-prices/refresh-cron')
  @HttpCode(200)
  @UseGuards(RefreshTokenGuard)
  refreshCron(): Promise<RnmRefreshResult> {
    return this.#run();
  }

  async #run(): Promise<RnmRefreshResult> {
    this.#logger.log('Refresh RNM démarré.');
    try {
      const result = await this.rnm.refresh();
      this.#logger.log(
        `Refresh RNM réussi : ${result.updatedVarieties} variétés mises à jour (${result.detailRows} cotations).`,
      );
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Échec de l'import RNM.";
      this.#logger.error(`Refresh RNM échoué : ${message}`);
      throw new BadGatewayException(message);
    }
  }
}
