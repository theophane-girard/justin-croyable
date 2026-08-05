import { Injectable, signal } from '@angular/core';

import { SEASON_FILTER_ALL, type SeasonFilter } from './potager.model';

@Injectable({ providedIn: 'root' })
export class SeasonStore {
  readonly #season = signal<SeasonFilter>(SEASON_FILTER_ALL);

  readonly season = this.#season.asReadonly();

  setSeason(season: SeasonFilter): void {
    this.#season.set(season);
  }
}
