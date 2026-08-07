import { Injectable, signal } from '@angular/core';

import { SEASON_FILTER_ALL, type SeasonFilter, type YearFilter } from './potager.model';

const YEAR_AUTO = 'auto';

export type YearSelection = YearFilter | typeof YEAR_AUTO;

@Injectable({ providedIn: 'root' })
export class SeasonStore {
  readonly #season = signal<SeasonFilter>(SEASON_FILTER_ALL);
  readonly #yearSelection = signal<YearSelection>(YEAR_AUTO);

  readonly season = this.#season.asReadonly();
  readonly yearSelection = this.#yearSelection.asReadonly();

  setSeason(season: SeasonFilter): void {
    this.#season.set(season);
  }

  setYear(year: YearSelection): void {
    this.#yearSelection.set(year);
  }
}
