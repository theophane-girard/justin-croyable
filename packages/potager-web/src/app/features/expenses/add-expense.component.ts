import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import {
  ButtonComponent,
  CardComponent,
  DatePickerComponent,
  InputDirective,
  InputGroupComponent,
  SelectImports,
  SwitchComponent,
} from '@justin-croyable/design-system';
import { NgIcon } from '@ng-icons/core';

import {
  EXPENSE_CATEGORIES,
  type ExpenseDraft,
  isExpenseCategoryId,
} from '../../core/potager.model';
import { ExpenseStore } from '../../core/expense-store';
import { GardenStore } from '../../core/garden-store';
import { EXPENSES_LINK } from '../../app.routes';

type ExpenseEntry = {
  readonly key: number;
  readonly label: string;
  readonly category: string;
  readonly amountInput: string;
  readonly date: Date | null;
  readonly allPlants: boolean;
  readonly plantIds: readonly string[];
};

type ExpenseEntryRow = ExpenseEntry & {
  readonly title: string;
  readonly removeAction: string;
  readonly selectedPlantIds: string[];
};

const REMOVE_ACTION = 'Retirer';

@Component({
  selector: 'app-add-expense',
  imports: [
    ...SelectImports,
    NgIcon,
    ButtonComponent,
    CardComponent,
    InputDirective,
    InputGroupComponent,
    DatePickerComponent,
    SwitchComponent,
  ],
  template: `
    <div class="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <div class="flex items-center justify-between gap-2">
        <div class="flex flex-col">
          <p class="text-muted-foreground text-sm">Renseignez le libellé, la catégorie et le montant.</p>
        </div>
        <button appButton [buttonDisabled]="!canSubmit()" (click)="onSave()">
          <ng-icon name="phosphorFloppyDisk" class="size-4" />
          {{ saveLabel() }}
        </button>
      </div>

      @for (entry of entryRows(); track entry.key) {
        <app-card
          [title]="entry.title"
          [action]="entry.removeAction"
          (actionClick)="onRemoveEntry(entry.key)"
        >
          <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
            <app-input-group label="Libellé" hint="Ex. : plants de tomate." [required]="true">
              <input
                app-input
                type="text"
                placeholder="Achat…"
                [value]="entry.label"
                (input)="onLabelInput(entry.key, $event)"
              />
            </app-input-group>

            <app-select
              label="Catégorie"
              placeholder="Sélectionner une catégorie…"
              [required]="true"
              [value]="entry.category"
              (valueChange)="onCategoryChange(entry.key, $event)"
            >
              @for (option of categories; track option.id) {
                <app-select-item [value]="option.id">{{ option.label }}</app-select-item>
              }
            </app-select>

            <app-input-group label="Montant" hint="En euros." [required]="true">
              <input
                app-input
                type="number"
                inputmode="decimal"
                min="0"
                step="0.01"
                placeholder="0"
                [value]="entry.amountInput"
                (input)="onAmountInput(entry.key, $event)"
              />
            </app-input-group>

            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium">Date d'achat</label>
              <app-date-picker
                placeholder="Choisir une date"
                format="d MMMM yyyy"
                type="outline"
                [value]="entry.date"
                (valueChange)="onDateChange(entry.key, $event)"
              />
            </div>

            <div class="flex flex-col gap-3 md:col-span-2">
              <div class="flex items-center justify-between gap-3">
                <div class="flex flex-col">
                  <span class="text-sm font-medium">Affecter à tous les plants</span>
                  <span class="text-muted-foreground text-xs">
                    Le montant est réparti à parts égales entre les plants concernés.
                  </span>
                </div>
                <app-switch
                  [checked]="entry.allPlants"
                  (checkedChange)="onAllPlantsChange(entry.key, $event)"
                />
              </div>

              @if (!entry.allPlants) {
                <app-select
                  label="Plants concernés"
                  placeholder="Sélectionner un ou plusieurs plants…"
                  [required]="true"
                  [multiple]="true"
                  [maxLabelCount]="3"
                  [value]="entry.selectedPlantIds"
                  (valueChange)="onPlantsChange(entry.key, $event)"
                >
                  @for (plant of plants(); track plant.id) {
                    <app-select-item [value]="plant.id">
                      {{ plant.label }} ({{ plant.quantity }})
                    </app-select-item>
                  }
                </app-select>
              }
            </div>
          </div>
        </app-card>
      }

      <button appButton variant="outline" class="self-start" (click)="onAddEntry()">
        <ng-icon name="phosphorPlus" class="size-4" />
        Ajouter une dépense
      </button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddExpenseComponent {
  protected readonly store = inject(ExpenseStore);
  readonly #garden = inject(GardenStore);
  readonly #router = inject(Router);

  protected readonly categories = EXPENSE_CATEGORIES;
  protected readonly plants = this.#garden.rows;

  readonly #entries = signal<readonly ExpenseEntry[]>([this.#blankEntry(0)]);
  #nextKey = 1;

  protected readonly entryRows = computed<ExpenseEntryRow[]>(() => {
    const entries = this.#entries();
    const removeAction = entries.length > 1 ? REMOVE_ACTION : '';
    return entries.map((entry, index) => ({
      ...entry,
      title: `Dépense ${index + 1}`,
      removeAction,
      selectedPlantIds: [...entry.plantIds],
    }));
  });

  protected readonly canSubmit = computed(
    () =>
      this.#entries().length > 0 && this.#entries().every(entry => this.#toDraft(entry) !== null),
  );

  protected readonly saveLabel = computed(() =>
    this.#entries().length > 1 ? `Enregistrer (${this.#entries().length})` : 'Enregistrer',
  );

  protected onAddEntry(): void {
    this.#entries.update(entries => [...entries, this.#blankEntry(this.#nextKey)]);
    this.#nextKey += 1;
  }

  protected onRemoveEntry(key: number): void {
    this.#entries.update(entries => entries.filter(entry => entry.key !== key));
  }

  protected onLabelInput(key: number, event: Event): void {
    this.#patch(key, { label: (event.target as HTMLInputElement).value });
  }

  protected onCategoryChange(key: number, value: string | string[] | null): void {
    if (typeof value !== 'string') {
      return;
    }
    this.#patch(key, { category: value });
  }

  protected onAmountInput(key: number, event: Event): void {
    this.#patch(key, { amountInput: (event.target as HTMLInputElement).value });
  }

  protected onDateChange(key: number, date: Date | null): void {
    this.#patch(key, { date });
  }

  protected onAllPlantsChange(key: number, allPlants: boolean): void {
    this.#patch(key, { allPlants, plantIds: [] });
  }

  protected onPlantsChange(key: number, value: string | string[] | null): void {
    if (Array.isArray(value)) {
      this.#patch(key, { plantIds: value });
      return;
    }
    this.#patch(key, { plantIds: typeof value === 'string' && value.length > 0 ? [value] : [] });
  }

  protected onSave(): void {
    const drafts = this.#entries()
      .map(entry => this.#toDraft(entry))
      .filter((draft): draft is ExpenseDraft => draft !== null);
    if (drafts.length !== this.#entries().length || drafts.length === 0) {
      return;
    }
    drafts.forEach(draft => this.store.add(draft));
    this.#router.navigateByUrl(EXPENSES_LINK);
  }

  #blankEntry(key: number): ExpenseEntry {
    return {
      key,
      label: '',
      category: '',
      amountInput: '',
      date: new Date(),
      allPlants: true,
      plantIds: [],
    };
  }

  #patch(key: number, patch: Partial<Omit<ExpenseEntry, 'key'>>): void {
    this.#entries.update(entries =>
      entries.map(entry => (entry.key === key ? { ...entry, ...patch } : entry)),
    );
  }

  #toDraft(entry: ExpenseEntry): ExpenseDraft | null {
    const label = entry.label.trim();
    const amountEur = Number.parseFloat(entry.amountInput.replace(',', '.'));
    const spentOn = entry.date;
    if (label.length === 0 || !isExpenseCategoryId(entry.category) || spentOn === null) {
      return null;
    }
    if (!Number.isFinite(amountEur) || amountEur <= 0) {
      return null;
    }
    if (!entry.allPlants && entry.plantIds.length === 0) {
      return null;
    }
    const plantIds = entry.allPlants ? [] : [...entry.plantIds];
    return { label, category: entry.category, amountEur, spentOn, plantIds };
  }
}
