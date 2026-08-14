import { type RnmRefreshResult } from '@justin-croyable/api-contract';
import { Inject, Injectable } from '@nestjs/common';
import { eq, isNull } from 'drizzle-orm';

import { type Database, DRIZZLE } from '../../db/drizzle';
import { varieties, varietyPrices } from '../../db/schema';

import { MIN_EXPECTED_DETAIL_ROWS, RNM_SOURCE } from './rnm.constants';
import { type ResolvedVarietyPrice, resolvePrices } from './rnm-mapping';
import { parseRnmCsv } from './rnm-parser';
import { downloadRnmZip } from './rnm-source';

type InsertablePrice = { readonly price: ResolvedVarietyPrice; readonly varietyId: string };

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
    const idBySlug = await this.#referenceIdBySlug();
    const insertable = resolved
      .map(price => ({ price, varietyId: idBySlug.get(price.varietyId) }))
      .filter((entry): entry is InsertablePrice => entry.varietyId !== undefined);
    if (insertable.length === 0) {
      throw new Error(
        'RNM : aucune variété de référence correspondante en base, import annulé.',
      );
    }
    await this.db.transaction(async tx => {
      await tx.delete(varietyPrices).where(eq(varietyPrices.source, RNM_SOURCE));
      await tx.insert(varietyPrices).values(
        insertable.map(entry => ({
          varietyId: entry.varietyId,
          conventionalPricePerKg: entry.price.conventionalPricePerKg,
          bioPricePerKg: entry.price.bioPricePerKg,
          effectiveFrom: entry.price.effectiveFrom,
          source: RNM_SOURCE,
        })),
      );
    });
    return {
      source: RNM_SOURCE,
      updatedVarieties: insertable.length,
      detailRows: observations.length,
      effectiveFrom: effectiveFrom.toISOString(),
    };
  }

  async #referenceIdBySlug(): Promise<Map<string, string>> {
    const rows = await this.db
      .select({ id: varieties.id, slug: varieties.slug })
      .from(varieties)
      .where(isNull(varieties.gardenId));
    return new Map(
      rows
        .filter((row): row is { id: string; slug: string } => row.slug !== null)
        .map(row => [row.slug, row.id]),
    );
  }
}
