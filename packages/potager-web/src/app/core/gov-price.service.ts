import { Injectable, signal } from '@angular/core';

import { type PricePerKgByVariety, type PriceSource } from './potager.model';

const REFERENCE_SOURCE: PriceSource = 'reference';

@Injectable({ providedIn: 'root' })
export class GovPriceService {
  readonly livePrices = signal<PricePerKgByVariety | null>(null);
  readonly liveBioPrices = signal<PricePerKgByVariety | null>(null);
  readonly priceSource = signal<PriceSource>(REFERENCE_SOURCE);
  readonly bioPriceSource = signal<PriceSource>(REFERENCE_SOURCE);
  readonly priceDate = signal<Date | null>(null);
}
