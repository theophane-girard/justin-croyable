import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import {
  ButtonComponent,
  CardComponent,
  DatePickerComponent,
  EmptyComponent,
  InputDirective,
  InputGroupComponent,
  SelectImports,
} from '@justin-croyable/design-system';
import { NgIcon } from '@ng-icons/core';

import {
  cropUnit,
  HARVEST_UNIT,
  HARVEST_UNIT_META,
  type HarvestDraft,
  type HarvestUnitMeta,
} from '../../core/potager.model';
import { CatalogStore } from '../../core/catalog-store';
import { GardenStore } from '../../core/garden-store';
import { HarvestStore } from '../../core/harvest-store';
import { GARDEN_ADD_LINK, HARVESTS_LINK } from '../../app.routes';

type HarvestEntry = {
  readonly key: number;
  readonly varietyId: string;
  readonly weightInput: string;
  readonly date: Date | null;
};

type HarvestEntryRow = HarvestEntry & {
  readonly title: string;
  readonly removeAction: string;
  readonly unitMeta: HarvestUnitMeta;
};

const REMOVE_ACTION = 'Retirer';

@Component({
  selector: 'app-add-harvest',
  imports: [
    RouterLink,
    ...SelectImports,
    NgIcon,
    ButtonComponent,
    CardComponent,
    EmptyComponent,
    InputDirective,
    InputGroupComponent,
    DatePickerComponent,
  ],
  template: `
    <div class="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <div class="flex items-center justify-between gap-2">
        <div class="flex flex-col">
          <p class="text-muted-foreground text-sm">
            Renseignez la variété, la quantité et la date.
          </p>
        </div>
        @if (hasPlantedVarieties()) {
          <button appButton [buttonDisabled]="!canSubmit()" (click)="onSave()">
            <ng-icon name="phosphorFloppyDisk" class="size-4" />
            {{ saveLabel() }}
          </button>
        }
      </div>

      @if (!hasPlantedVarieties()) {
        <app-empty
          icon="phosphorPottedPlant"
          title="Votre jardin est vide"
          description="Seules les variétés plantées dans votre jardin peuvent être récoltées. Ajoutez d'abord un plant."
        >
          <a appButton [routerLink]="gardenAddLink">
            <ng-icon name="phosphorPlus" class="size-4" />
            Ajouter un plant
          </a>
        </app-empty>
      } @else {
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
                  [value]="entry.varietyId"
                  (valueChange)="onVarietyChange(entry.key, $event)"
                >
                  @for (option of plantedOptions(); track option.id) {
                    <app-select-item [value]="option.id">{{ option.label }}</app-select-item>
                  }
                </app-select>
              </div>

              <app-input-group
                [label]="entry.unitMeta.quantityLabel"
                [hint]="entry.unitMeta.quantityHint"
                [required]="true"
              >
                <input
                  app-input
                  type="number"
                  min="0"
                  placeholder="0"
                  [attr.inputmode]="entry.unitMeta.inputMode"
                  [attr.step]="entry.unitMeta.step"
                  [value]="entry.weightInput"
                  (input)="onWeightInput(entry.key, $event)"
                />
              </app-input-group>

              <div class="flex flex-col gap-2">
                <label class="text-sm font-medium">Date de récolte</label>
                <app-date-picker
                  placeholder="Choisir une date"
                  format="d MMMM yyyy"
                  type="outline"
                  [value]="entry.date"
                  (valueChange)="onDateChange(entry.key, $event)"
                />
              </div>
            </div>
          </app-card>
        }

        <button appButton variant="outline" class="self-start" (click)="onAddEntry()">
          <ng-icon name="phosphorPlus" class="size-4" />
          Ajouter une récolte
        </button>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddHarvestComponent {
  protected readonly store = inject(HarvestStore);
  readonly #catalog = inject(CatalogStore);
  readonly #garden = inject(GardenStore);
  readonly #router = inject(Router);

  protected readonly gardenAddLink = GARDEN_ADD_LINK;

  protected readonly plantedOptions = this.#garden.plantedVarietyOptions;
  protected readonly hasPlantedVarieties = computed(() => this.plantedOptions().length > 0);

  readonly #entries = signal<readonly HarvestEntry[]>([this.#blankEntry(0)]);
  #nextKey = 1;

  protected readonly entryRows = computed<HarvestEntryRow[]>(() => {
    const entries = this.#entries();
    const removeAction = entries.length > 1 ? REMOVE_ACTION : '';
    return entries.map((entry, index) => ({
      ...entry,
      title: `Récolte ${index + 1}`,
      removeAction,
      unitMeta: this.#unitMetaFor(entry.varietyId),
    }));
  });

  protected readonly canSubmit = computed(
    () =>
      this.hasPlantedVarieties() &&
      this.#entries().length > 0 &&
      this.#entries().every(entry => this.#toDraft(entry) !== null),
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

  protected onVarietyChange(key: number, value: string | string[] | null): void {
    if (typeof value !== 'string') {
      return;
    }
    this.#patch(key, { varietyId: value });
  }

  protected onWeightInput(key: number, event: Event): void {
    this.#patch(key, { weightInput: (event.target as HTMLInputElement).value });
  }

  protected onDateChange(key: number, date: Date | null): void {
    this.#patch(key, { date });
  }

  protected onSave(): void {
    const drafts = this.#entries()
      .map(entry => this.#toDraft(entry))
      .filter((draft): draft is HarvestDraft => draft !== null);
    if (drafts.length !== this.#entries().length || drafts.length === 0) {
      return;
    }
    drafts.forEach(draft => this.store.add(draft));
    this.#router.navigateByUrl(HARVESTS_LINK);
  }

  #blankEntry(key: number): HarvestEntry {
    return { key, varietyId: '', weightInput: '', date: new Date() };
  }

  #patch(key: number, patch: Partial<Omit<HarvestEntry, 'key'>>): void {
    this.#entries.update(entries =>
      entries.map(entry => (entry.key === key ? { ...entry, ...patch } : entry)),
    );
  }

  #unitMetaFor(varietyId: string): HarvestUnitMeta {
    const variety = this.#catalog.byId().get(varietyId);
    return HARVEST_UNIT_META[variety ? cropUnit(variety.cropId) : HARVEST_UNIT.kilogram];
  }

  #toDraft(entry: HarvestEntry): HarvestDraft | null {
    const planted = this.#garden.plantedVarietyIds();
    if (!planted.has(entry.varietyId)) {
      return null;
    }
    const parsed = Number.parseFloat(entry.weightInput.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return null;
    }
    if (this.#unitMetaFor(entry.varietyId).integerOnly && !Number.isInteger(parsed)) {
      return null;
    }
    const harvestedOn = entry.date;
    if (harvestedOn === null) {
      return null;
    }
    return { varietyId: entry.varietyId, weightKg: parsed, harvestedOn };
  }
}
