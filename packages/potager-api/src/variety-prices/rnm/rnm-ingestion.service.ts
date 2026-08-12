import { type RnmRefreshResult } from '@justin-croyable/api-contract';
import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { type Database, DRIZZLE } from '../../db/drizzle';
import { varietyPrices } from '../../db/schema';

import { MIN_EXPECTED_DETAIL_ROWS, RNM_SOURCE } from './rnm.constants';
import { resolvePrices } from './rnm-mapping';
import { parseRnmCsv } from './rnm-parser';
import { downloadRnmZip } from './rnm-source';

@Injectable()
export class RnmIngestionService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async refresh(): Promise<RnmRefreshResult> {
    const year = new Date().getUTCFullYear();
    const zip = await downloadRnmZip(year);
    const observations = parseRnmCsv(zip);
    if (observations.length < MIN_EXPECTED_DETAIL_ROWS) {
      throw new Error(
        `RNM : seulement ${observations.length} cotations détail exploitables, import annulé.`,
      );
    }
    const resolved = resolvePrices(observations);
    if (resolved.length === 0) {
      throw new Error('RNM : aucune variété résolue, import annulé.');
    }
    const effectiveFrom = new Date(
      resolved.reduce((max, price) => Math.max(max, price.effectiveFrom.getTime()), 0),
    );
    await this.db.transaction(async tx => {
      await tx.delete(varietyPrices).where(eq(varietyPrices.source, RNM_SOURCE));
      await tx.insert(varietyPrices).values(
        resolved.map(price => ({
          varietyId: price.varietyId,
          conventionalPricePerKg: price.conventionalPricePerKg,
          bioPricePerKg: price.bioPricePerKg,
          effectiveFrom: price.effectiveFrom,
          source: RNM_SOURCE,
        })),
      );
    });
    return {
      source: RNM_SOURCE,
      updatedVarieties: resolved.length,
      detailRows: observations.length,
      effectiveFrom: effectiveFrom.toISOString(),
    };
  }
}
