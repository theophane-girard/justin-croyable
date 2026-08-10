import { computed, inject, Injectable } from '@angular/core';
import { type Expense } from '@justin-croyable/api-contract';

import {
  EXPENSE_CATEGORY_META,
  type ExpenseCategoryId,
  type ExpenseDraft,
  type ExpenseRow,
  isExpenseCategoryId,
  matchesSeason,
  matchesYear,
  seasonForDate,
} from './potager.model';
import { ApiEntityStore } from './api-entity-store';
import { HarvestStore } from './harvest-store';
import { SeasonStore } from './season-store';

const MONTHS_IN_YEAR = 12;

type NamedValue = { readonly label: string; readonly value: number };

@Injectable({ providedIn: 'root' })
export class ExpenseStore extends ApiEntityStore<Expense> {
  readonly #season = inject(SeasonStore).season;
  readonly #effectiveYear = inject(HarvestStore).effectiveYear;

  readonly rows = computed<ExpenseRow[]>(() =>
    this.entries()
      .filter(entry => isExpenseCategoryId(entry.category))
      .map(entry => this.#toRow(entry))
      .sort((a, b) => b.spentOn.getTime() - a.spentOn.getTime()),
  );

  readonly #periodRows = computed<ExpenseRow[]>(() => {
    const season = this.#season();
    const year = this.#effectiveYear();
    return this.rows().filter(
      row => matchesSeason(row.season, season) && matchesYear(row.spentOn.getFullYear(), year),
    );
  });

  readonly periodRows = this.#periodRows;

  readonly expenseCount = computed(() => this.entries().length);

  readonly totalExpensesEur = computed(() =>
    this.#roundToCents(this.#periodRows().reduce((total, row) => total + row.amountEur, 0)),
  );

  readonly monthlyExpenses = computed(() =>
    this.#bucketByMonth(this.#periodRows(), row => row.amountEur),
  );

  readonly expensesByCategory = computed<NamedValue[]>(() =>
    this.#groupBy(this.#periodRows(), row => row.categoryLabel, row => row.amountEur).sort(
      (a, b) => b.value - a.value,
    ),
  );

  add(draft: ExpenseDraft): void {
    void this.createEntry(() =>
      this.api.createExpense({
        label: draft.label,
        category: draft.category,
        amountEur: draft.amountEur,
        spentOn: draft.spentOn.toISOString(),
        plantIds: [...draft.plantIds],
      }),
    );
  }

  remove(id: string): void {
    void this.removeEntry(id, () => this.api.removeExpense(id));
  }

  protected fetchAll() {
    return this.api.listExpenses();
  }

  #toRow(entry: Expense): ExpenseRow {
    const categoryId = entry.category as ExpenseCategoryId;
    const meta = EXPENSE_CATEGORY_META[categoryId];
    const spentOn = new Date(entry.spentOn);
    return {
      id: entry.id,
      label: entry.label,
      categoryId,
      categoryLabel: meta.label,
      categoryIcon: meta.icon,
      spentOn,
      season: seasonForDate(spentOn),
      amountEur: entry.amountEur,
      plantIds: entry.plantIds,
    };
  }

  #bucketByMonth(rows: readonly ExpenseRow[], pick: (row: ExpenseRow) => number): number[] {
    const totals = rows.reduce<Map<number, number>>((accumulator, row) => {
      const month = row.spentOn.getMonth();
      accumulator.set(month, (accumulator.get(month) ?? 0) + pick(row));
      return accumulator;
    }, new Map());

    return Array.from({ length: MONTHS_IN_YEAR }, (_, month) =>
      this.#roundToCents(totals.get(month) ?? 0),
    );
  }

  #groupBy(
    rows: readonly ExpenseRow[],
    key: (row: ExpenseRow) => string,
    pick: (row: ExpenseRow) => number,
  ): NamedValue[] {
    const totals = rows.reduce<Map<string, number>>((accumulator, row) => {
      const label = key(row);
      accumulator.set(label, (accumulator.get(label) ?? 0) + pick(row));
      return accumulator;
    }, new Map());

    return Array.from(totals.entries()).map(([label, value]) => ({
      label,
      value: this.#roundToCents(value),
    }));
  }

  #roundToCents(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
