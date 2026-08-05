import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import {
  ButtonComponent,
  CardComponent,
  DatePickerComponent,
  InputDirective,
  InputGroupComponent,
  SelectImports,
} from '@justin-croyable/design-system';
import { NgIcon } from '@ng-icons/core';

import { EXPENSE_CATEGORIES, isExpenseCategoryId } from '../../core/potager.model';
import { ExpenseStore } from '../../core/expense-store';
import { EXPENSES_LINK } from '../../app.routes';

@Component({
  selector: 'app-add-expense',
  imports: [
    RouterLink,
    ...SelectImports,
    NgIcon,
    ButtonComponent,
    CardComponent,
    InputDirective,
    InputGroupComponent,
    DatePickerComponent,
  ],
  template: `
    <div class="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <div class="flex items-center justify-between gap-2">
        <div class="flex flex-col">
          <h2 class="text-foreground text-lg font-semibold">Nouvelle dépense</h2>
          <p class="text-muted-foreground text-sm">Renseignez le libellé, la catégorie et le montant.</p>
        </div>
        <div class="flex items-center gap-2">
          <a appButton variant="outline" [routerLink]="expensesLink">Annuler</a>
          <button appButton [buttonDisabled]="!canSubmit()" (click)="onSave()">
            <ng-icon name="phosphorPlus" class="size-4" />
            Enregistrer
          </button>
        </div>
      </div>

      <app-card>
        <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
          <app-input-group label="Libellé" hint="Ex. : plants de tomate." [required]="true">
            <input
              app-input
              type="text"
              placeholder="Achat…"
              [value]="label()"
              (input)="onLabelInput($event)"
            />
          </app-input-group>

          <app-select
            label="Catégorie"
            placeholder="Sélectionner une catégorie…"
            [required]="true"
            [value]="category()"
            (valueChange)="onCategoryChange($event)"
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
              [value]="amountInput()"
              (input)="onAmountInput($event)"
            />
          </app-input-group>

          <div class="flex flex-col gap-2 md:col-span-2">
            <label class="text-sm font-medium">Date d'achat</label>
            <app-date-picker
              placeholder="Choisir une date"
              format="d MMMM yyyy"
              type="outline"
              [value]="date()"
              (valueChange)="date.set($event)"
            />
          </div>
        </div>
      </app-card>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddExpenseComponent {
  protected readonly store = inject(ExpenseStore);
  readonly #router = inject(Router);

  protected readonly categories = EXPENSE_CATEGORIES;
  protected readonly expensesLink = EXPENSES_LINK;

  protected readonly label = signal<string>('');
  protected readonly category = signal<string>('');
  protected readonly amountInput = signal<string>('');
  protected readonly date = signal<Date | null>(new Date());

  protected readonly amountEur = computed(() => {
    const parsed = Number.parseFloat(this.amountInput().replace(',', '.'));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  });

  protected readonly canSubmit = computed(
    () =>
      this.label().trim().length > 0 &&
      isExpenseCategoryId(this.category()) &&
      this.amountEur() !== null &&
      this.date() !== null,
  );

  protected onLabelInput(event: Event): void {
    this.label.set((event.target as HTMLInputElement).value);
  }

  protected onCategoryChange(value: string | string[] | null): void {
    if (typeof value !== 'string') {
      return;
    }
    this.category.set(value);
  }

  protected onAmountInput(event: Event): void {
    this.amountInput.set((event.target as HTMLInputElement).value);
  }

  protected onSave(): void {
    const label = this.label().trim();
    const category = this.category();
    const amountEur = this.amountEur();
    const spentOn = this.date();
    if (!label || !isExpenseCategoryId(category) || amountEur === null || spentOn === null) {
      return;
    }
    this.store.add({ label, category, amountEur, spentOn });
    this.#router.navigateByUrl(EXPENSES_LINK);
  }
}
