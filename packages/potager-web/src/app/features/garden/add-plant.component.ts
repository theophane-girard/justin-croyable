import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import {
  ButtonComponent,
  CardComponent,
  InputDirective,
  InputGroupComponent,
  SelectImports,
} from '@justin-croyable/design-system';
import { NgIcon } from '@ng-icons/core';

import { CROPS, isCropId } from '../../core/potager.model';
import { CatalogStore } from '../../core/catalog-store';
import { GardenStore } from '../../core/garden-store';
import { GARDEN_LINK } from '../../app.routes';

@Component({
  selector: 'app-add-plant',
  imports: [
    RouterLink,
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
          <h2 class="text-foreground text-lg font-semibold">Ajouter un plant</h2>
          <p class="text-muted-foreground text-sm">
            Renseignez la culture, la variété et le nombre de plants.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <a appButton variant="outline" [routerLink]="gardenLink">Annuler</a>
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

          <app-input-group label="Nombre de plants" hint="Pieds cultivés." [required]="true">
            <input
              app-input
              type="number"
              inputmode="numeric"
              min="1"
              step="1"
              placeholder="0"
              [value]="quantityInput()"
              (input)="onQuantityInput($event)"
            />
          </app-input-group>
        </div>
      </app-card>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddPlantComponent {
  protected readonly store = inject(GardenStore);
  readonly #catalog = inject(CatalogStore);
  readonly #router = inject(Router);

  protected readonly crops = CROPS;
  protected readonly gardenLink = GARDEN_LINK;

  protected readonly cropId = signal<string>('');
  protected readonly varietyId = signal<string>('');
  protected readonly quantityInput = signal<string>('');

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

  protected readonly quantity = computed(() => {
    const parsed = Number.parseInt(this.quantityInput(), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  });

  protected readonly canSubmit = computed(
    () => isCropId(this.cropId()) && this.#catalog.isKnown(this.varietyId()) && this.quantity() !== null,
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
    if (typeof value === 'string') {
      this.varietyId.set(value);
    }
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

  protected onQuantityInput(event: Event): void {
    this.quantityInput.set((event.target as HTMLInputElement).value);
  }

  protected onSave(): void {
    const cropId = this.cropId();
    const varietyId = this.varietyId();
    const quantity = this.quantity();
    if (!isCropId(cropId) || !this.#catalog.isKnown(varietyId) || quantity === null) {
      return;
    }
    this.store.add({ cropId, varietyId, quantity });
    this.#router.navigateByUrl(GARDEN_LINK);
  }
}
