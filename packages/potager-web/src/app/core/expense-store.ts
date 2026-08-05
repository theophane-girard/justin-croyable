import { isPlatformBrowser } from '@angular/common';
import { computed, effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

import {
  EXPENSE_CATEGORY_META,
  type ExpenseDraft,
  type ExpenseEntry,
  type ExpenseRow,
  isExpenseCategoryId,
} from './potager.model';

const STORAGE_KEY = 'potager.expenses.v1';
const MONTHS_IN_YEAR = 12;

type NamedValue = { readonly label: string; readonly value: number };

const SEED_EXPENSES: readonly ExpenseEntry[] = [
  { id: 'exp-1', label: 'Sachets de graines', category: 'semences', amountEur: 18.5, spentOn: '2026-03-04' },
  { id: 'exp-2', label: 'Plants de tomate', category: 'plants', amountEur: 24, spentOn: '2026-04-12' },
  { id: 'exp-3', label: 'Terreau potager 70L', category: 'substrat', amountEur: 32.9, spentOn: '2026-03-20' },
  { id: 'exp-4', label: 'Engrais organique', category: 'engrais', amountEur: 14.2, spentOn: '2026-05-02' },
  { id: 'exp-5', label: 'Tuyau microporeux', category: 'arrosage', amountEur: 21.5, spentOn: '2026-05-15' },
];

@Injectable({ providedIn: 'root' })
export class ExpenseStore {
  readonly #platformId = inject(PLATFORM_ID);

  readonly #entries = signal<readonly ExpenseEntry[]>(this.#restore());

  readonly entries = this.#entries.asReadonly();

  readonly rows = computed<ExpenseRow[]>(() =>
    this.#entries()
      .map(entry => this.#toRow(entry))
      .sort((a, b) => b.spentOn.getTime() - a.spentOn.getTime()),
  );

  readonly expenseCount = computed(() => this.#entries().length);

  readonly totalExpensesEur = computed(() =>
    this.#roundToCents(this.#entries().reduce((total, entry) => total + entry.amountEur, 0)),
  );

  readonly monthlyExpenses = computed(() =>
    this.#bucketByMonth(this.rows(), row => row.amountEur),
  );

  readonly expensesByCategory = computed<NamedValue[]>(() =>
    this.#groupBy(this.rows(), row => row.categoryLabel, row => row.amountEur).sort(
      (a, b) => b.value - a.value,
    ),
  );

  constructor() {
    effect(() => this.#persist(this.#entries()));
  }

  add(draft: ExpenseDraft): void {
    const entry: ExpenseEntry = {
      id: this.#createId(),
      label: draft.label,
      category: draft.category,
      amountEur: draft.amountEur,
      spentOn: this.#toIsoDate(draft.spentOn),
    };
    this.#entries.update(entries => [...entries, entry]);
  }

  remove(id: string): void {
    this.#entries.update(entries => entries.filter(entry => entry.id !== id));
  }

  #toRow(entry: ExpenseEntry): ExpenseRow {
    const meta = EXPENSE_CATEGORY_META[entry.category];
    return {
      id: entry.id,
      label: entry.label,
      categoryId: entry.category,
      categoryLabel: meta.label,
      categoryIcon: meta.icon,
      spentOn: new Date(entry.spentOn),
      amountEur: entry.amountEur,
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

  #restore(): readonly ExpenseEntry[] {
    if (!isPlatformBrowser(this.#platformId)) {
      return SEED_EXPENSES;
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return SEED_EXPENSES;
    }
    return this.#parseStored(raw) ?? SEED_EXPENSES;
  }

  #parseStored(raw: string): readonly ExpenseEntry[] | null {
    try {
      const value: unknown = JSON.parse(raw);
      if (!Array.isArray(value)) {
        return null;
      }
      return value.filter((item): item is ExpenseEntry => this.#isValidEntry(item));
    } catch {
      return null;
    }
  }

  #isValidEntry(item: unknown): item is ExpenseEntry {
    if (typeof item !== 'object' || item === null) {
      return false;
    }
    const candidate = item as Record<string, unknown>;
    return (
      typeof candidate['id'] === 'string' &&
      typeof candidate['label'] === 'string' &&
      typeof candidate['category'] === 'string' &&
      isExpenseCategoryId(candidate['category']) &&
      typeof candidate['amountEur'] === 'number' &&
      typeof candidate['spentOn'] === 'string'
    );
  }

  #persist(entries: readonly ExpenseEntry[]): void {
    if (!isPlatformBrowser(this.#platformId)) {
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }

  #createId(): string {
    return crypto.randomUUID();
  }

  #toIsoDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  #roundToCents(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
