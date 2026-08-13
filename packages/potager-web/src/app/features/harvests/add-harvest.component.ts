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

import { CROPS } from '../../core/potager.model';
import { CatalogStore } from '../../core/catalog-store';
import { HarvestStore } from '../../core/harvest-store';
import { HARVESTS_LINK } from '../../app.routes';

@Component({
  selector: 'app-add-harvest',
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
          <h2 class="text-foreground text-lg font-semibold">Nouvelle récolte</h2>
          <p class="text-muted-foreground text-sm">
            Renseignez la culture, la variété, le poids et la date.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <a appButton variant="outline" [routerLink]="harvestsLink">Annuler</a>
          <button appButton [buttonDisabled]="!canSubmit()" (click)="onSave()">
            <ng-icon name="phosphorPlus" class="size-4" />
            Enregistrer
          </button>
        </div>
      </div>

      <app-card>
        <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
          <app-select
            label="Culture"
            placeholder="Sélectionner une culture…"
            [required]="true"
            [value]="cropId()"
            (valueChange)="onCropChange($event)"
          >
            @for (crop of crops; track crop.id) {
              <app-select-item [value]="crop.id">{{ crop.label }}</app-select-item>
            }
          </app-select>

          <app-select
            label="Variété"
            placeholder="Sélectionner une variété…"
            [required]="true"
            [disabled]="varieties().length === 0"
            [value]="varietyId()"
            (valueChange)="onVarietyChange($event)"
          >
            @for (variety of varieties(); track variety.id) {
              <app-select-item [value]="variety.id">{{ variety.label }}</app-select-item>
            }
          </app-select>

          <div class="flex flex-col gap-2 md:col-span-2">
            @if (!showCustomForm()) {
              <button
                type="button"
                class="text-primary self-start text-sm font-medium hover:underline disabled:opacity-50"
                [disabled]="referenceVarieties().length === 0"
                (click)="showCustomForm.set(true)"
              >
                + Nouvelle variété
              </button>
            } @else {
              <div class="border-border flex flex-col gap-3 rounded-lg border p-3">
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
                  @for (reference of referenceVarieties(); track reference.id) {
                    <app-select-item [value]="reference.id">{{ reference.label }}</app-select-item>
                  }
                </app-select>
                <div class="flex items-center justify-end gap-2">
                  <button appButton variant="outline" size="sm" (click)="cancelCustom()">Annuler</button>
                  <button appButton size="sm" [buttonDisabled]="!canCreateCustom()" (click)="createCustom()">
                    Créer
                  </button>
                </div>
              </div>
            }
          </div>

          <app-input-group label="Poids récolté" hint="En kilogrammes." [required]="true">
            <input
              app-input
              type="number"
              inputmode="decimal"
              min="0"
              step="0.1"
              placeholder="0"
              [value]="weightInput()"
              (input)="onWeightInput($event)"
            />
          </app-input-group>

          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium">Date de récolte</label>
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
export class AddHarvestComponent {
  protected readonly store = inject(HarvestStore);
  readonly #catalog = inject(CatalogStore);
  readonly #router = inject(Router);

  protected readonly crops = CROPS;
  protected readonly harvestsLink = HARVESTS_LINK;

  protected readonly cropId = signal<string>('');
  protected readonly varietyId = signal<string>('');
  protected readonly weightInput = signal<string>('');
  protected readonly date = signal<Date | null>(new Date());

  protected readonly varieties = computed(() => this.#catalog.varietiesForCrop(this.cropId()));
  protected readonly referenceVarieties = computed(() =>
    this.varieties().filter(variety => !variety.isCustom),
  );

  protected readonly showCustomForm = signal(false);
  protected readonly customLabel = signal<string>('');
  protected readonly customReferenceId = signal<string>('');

  protected readonly canCreateCustom = computed(
    () => this.customLabel().trim().length > 0 && this.#catalog.isKnown(this.customReferenceId()),
  );

  protected readonly weightKg = computed(() => {
    const parsed = Number.parseFloat(this.weightInput().replace(',', '.'));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  });

  protected readonly canSubmit = computed(
    () => this.#catalog.isKnown(this.varietyId()) && this.weightKg() !== null && this.date() !== null,
  );

  protected onCropChange(value: string | string[] | null): void {
    if (typeof value !== 'string') {
      return;
    }
    this.cropId.set(value);
    const varieties = this.#catalog.varietiesForCrop(value);
    this.varietyId.set(varieties.length === 1 ? varieties[0].id : '');
  }

  protected onVarietyChange(value: string | string[] | null): void {
    if (typeof value !== 'string') {
      return;
    }
    this.varietyId.set(value);
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
    this.cropId.set(created.cropId);
    this.varietyId.set(created.id);
    this.cancelCustom();
  }

  protected onWeightInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.weightInput.set(target.value);
  }

  protected onSave(): void {
    const varietyId = this.varietyId();
    const weightKg = this.weightKg();
    const harvestedOn = this.date();
    if (!this.#catalog.isKnown(varietyId) || weightKg === null || harvestedOn === null) {
      return;
    }
    this.store.add({ varietyId, weightKg, harvestedOn });
    this.#router.navigateByUrl(HARVESTS_LINK);
  }
}
