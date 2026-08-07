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
          <p class="text-muted-foreground text-sm">Renseignez la culture et le nombre de plants.</p>
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
  readonly #router = inject(Router);

  protected readonly crops = CROPS;
  protected readonly gardenLink = GARDEN_LINK;

  protected readonly cropId = signal<string>('');
  protected readonly quantityInput = signal<string>('');

  protected readonly quantity = computed(() => {
    const parsed = Number.parseInt(this.quantityInput(), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  });

  protected readonly canSubmit = computed(
    () => isCropId(this.cropId()) && this.quantity() !== null,
  );

  protected onCropChange(value: string | string[] | null): void {
    if (typeof value !== 'string') {
      return;
    }
    this.cropId.set(value);
  }

  protected onQuantityInput(event: Event): void {
    this.quantityInput.set((event.target as HTMLInputElement).value);
  }

  protected onSave(): void {
    const cropId = this.cropId();
    const quantity = this.quantity();
    if (!isCropId(cropId) || quantity === null) {
      return;
    }
    this.store.add({ cropId, quantity });
    this.#router.navigateByUrl(GARDEN_LINK);
  }
}
