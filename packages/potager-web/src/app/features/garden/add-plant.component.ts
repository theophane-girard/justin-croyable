import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import {
  ButtonComponent,
  CardComponent,
  InputDirective,
  InputGroupComponent,
  SelectImports,
} from '@justin-croyable/design-system';
import { NgIcon } from '@ng-icons/core';

import { type PlantDraft, type VarietyId } from '../../core/potager.model';
import { CatalogStore } from '../../core/catalog-store';
import { GardenStore } from '../../core/garden-store';
import { GARDEN_LINK } from '../../app.routes';

type PlantEntry = {
  readonly key: number;
  readonly varietyId: string;
  readonly quantityInput: string;
};

type PlantEntryRow = PlantEntry & {
  readonly title: string;
  readonly removeAction: string;
};

const REMOVE_ACTION = 'Retirer';

@Component({
  selector: 'app-add-plant',
  imports: [
    ...SelectImports,
    NgIcon,
    ButtonComponent,
    CardComponent,
    InputDirective,
    InputGroupComponent,
  ],
  template: `
    <div class="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <div class="flex items-center justify-between gap-2">
        <div class="flex flex-col">
          <p class="text-muted-foreground text-sm">
            Renseignez la variété et le nombre de plants.
          </p>
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
            <div class="md:col-span-2">
              <app-select
                label="Culture & variété"
                placeholder="Sélectionner une variété…"
                [required]="true"
                [disabled]="varietyOptions().length === 0"
                [value]="entry.varietyId"
                (valueChange)="onVarietyChange(entry.key, $event)"
              >
                @for (option of varietyOptions(); track option.id) {
                  <app-select-item [value]="option.id">{{ option.label }}</app-select-item>
                }
              </app-select>
            </div>

            <app-input-group label="Nombre de plants" hint="Pieds cultivés." [required]="true">
              <input
                app-input
                type="number"
                inputmode="numeric"
                min="1"
                step="1"
                placeholder="0"
                [value]="entry.quantityInput"
                (input)="onQuantityInput(entry.key, $event)"
              />
            </app-input-group>
          </div>
        </app-card>
      }

      <div class="flex flex-wrap items-center gap-2">
        <button appButton variant="outline" (click)="onAddEntry()">
          <ng-icon name="phosphorPlus" class="size-4" />
          Ajouter un plant
        </button>

        @if (!showCustomForm()) {
          <button
            appButton
            variant="ghost"
            [buttonDisabled]="referenceOptions().length === 0"
            (click)="showCustomForm.set(true)"
          >
            <ng-icon name="phosphorPlus" class="size-4" />
            Nouvelle variété
          </button>
        }
      </div>

      @if (showCustomForm()) {
        <app-card title="Nouvelle variété">
          <div class="flex flex-col gap-3">
            <app-input-group label="Nom de la variété" [required]="true">
              <input
                app-input
                type="text"
                placeholder="Ex. Tomate de mémé"
                [value]="customLabel()"
                (input)="onCustomLabelInput($event)"
              />
            </app-input-group>
            <app-select
              label="Variété de référence (prix)"
              placeholder="Sélectionner une référence…"
              [required]="true"
              [value]="customReferenceId()"
              (valueChange)="onCustomReferenceChange($event)"
            >
              @for (option of referenceOptions(); track option.id) {
                <app-select-item [value]="option.id">{{ option.label }}</app-select-item>
              }
            </app-select>
            <div class="flex items-center justify-end gap-2">
              <button appButton variant="outline" size="sm" (click)="cancelCustom()">Annuler</button>
              <button appButton size="sm" [buttonDisabled]="!canCreateCustom()" (click)="createCustom()">
                Créer
              </button>
            </div>
          </div>
        </app-card>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddPlantComponent {
  protected readonly store = inject(GardenStore);
  readonly #catalog = inject(CatalogStore);
  readonly #router = inject(Router);

  protected readonly varietyOptions = this.#catalog.varietyOptions;
  protected readonly referenceOptions = this.#catalog.referenceOptions;

  readonly #entries = signal<readonly PlantEntry[]>([{ key: 0, varietyId: '', quantityInput: '' }]);
  #nextKey = 1;

  protected readonly showCustomForm = signal(false);
  protected readonly customLabel = signal<string>('');
  protected readonly customReferenceId = signal<string>('');

  protected readonly entryRows = computed<PlantEntryRow[]>(() => {
    const entries = this.#entries();
    const removeAction = entries.length > 1 ? REMOVE_ACTION : '';
    return entries.map((entry, index) => ({
      ...entry,
      title: `Plant ${index + 1}`,
      removeAction,
    }));
  });

  protected readonly canCreateCustom = computed(
    () => this.customLabel().trim().length > 0 && this.#catalog.isKnown(this.customReferenceId()),
  );

  protected readonly canSubmit = computed(
    () =>
      this.#entries().length > 0 && this.#entries().every(entry => this.#toDraft(entry) !== null),
  );

  protected readonly saveLabel = computed(() =>
    this.#entries().length > 1 ? `Enregistrer (${this.#entries().length})` : 'Enregistrer',
  );

  protected onAddEntry(): void {
    this.#entries.update(entries => [
      ...entries,
      { key: this.#nextKey, varietyId: '', quantityInput: '' },
    ]);
    this.#nextKey += 1;
  }

  protected onRemoveEntry(key: number): void {
    this.#entries.update(entries => entries.filter(entry => entry.key !== key));
  }

  protected onVarietyChange(key: number, value: string | string[] | null): void {
    if (typeof value !== 'string') {
      return;
    }
    this.#patch(key, { varietyId: value });
  }

  protected onQuantityInput(key: number, event: Event): void {
    this.#patch(key, { quantityInput: (event.target as HTMLInputElement).value });
  }

  protected onCustomLabelInput(event: Event): void {
    this.customLabel.set((event.target as HTMLInputElement).value);
  }

  protected onCustomReferenceChange(value: string | string[] | null): void {
    if (typeof value === 'string') {
      this.customReferenceId.set(value);
    }
  }

  protected cancelCustom(): void {
    this.showCustomForm.set(false);
    this.customLabel.set('');
    this.customReferenceId.set('');
  }

  protected async createCustom(): Promise<void> {
    const label = this.customLabel().trim();
    const referenceId = this.customReferenceId();
    if (label.length === 0 || !this.#catalog.isKnown(referenceId)) {
      return;
    }
    const created = await this.#catalog.createCustom(label, referenceId);
    if (!created) {
      return;
    }
    this.#fillFirstEmptyVariety(created.id);
    this.cancelCustom();
  }

  protected onSave(): void {
    const drafts = this.#entries()
      .map(entry => this.#toDraft(entry))
      .filter((draft): draft is PlantDraft => draft !== null);
    if (drafts.length !== this.#entries().length || drafts.length === 0) {
      return;
    }
    this.#mergeByVariety(drafts).forEach(draft => this.store.add(draft));
    this.#router.navigateByUrl(GARDEN_LINK);
  }

  #fillFirstEmptyVariety(varietyId: VarietyId): void {
    const target = this.#entries().find(entry => entry.varietyId === '') ?? this.#entries()[0];
    if (target) {
      this.#patch(target.key, { varietyId });
    }
  }

  #patch(key: number, patch: Partial<Omit<PlantEntry, 'key'>>): void {
    this.#entries.update(entries =>
      entries.map(entry => (entry.key === key ? { ...entry, ...patch } : entry)),
    );
  }

  #toDraft(entry: PlantEntry): PlantDraft | null {
    const variety = this.#catalog.byId().get(entry.varietyId);
    if (!variety) {
      return null;
    }
    const quantity = Number.parseInt(entry.quantityInput, 10);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return null;
    }
    return { cropId: variety.cropId, varietyId: variety.id, quantity };
  }

  #mergeByVariety(drafts: readonly PlantDraft[]): readonly PlantDraft[] {
    const merged = drafts.reduce<Map<VarietyId, PlantDraft>>((accumulator, draft) => {
      const existing = accumulator.get(draft.varietyId);
      accumulator.set(
        draft.varietyId,
        existing ? { ...existing, quantity: existing.quantity + draft.quantity } : draft,
      );
      return accumulator;
    }, new Map());
    return Array.from(merged.values());
  }
}
