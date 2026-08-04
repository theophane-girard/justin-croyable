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

import { CROPS, isCropId } from '../../core/potager.model';
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
          <p class="text-muted-foreground text-sm">Renseignez la culture, le poids et la date.</p>
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

          <div class="flex flex-col gap-2 md:col-span-2">
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
  readonly #router = inject(Router);

  protected readonly crops = CROPS;
  protected readonly harvestsLink = HARVESTS_LINK;

  protected readonly cropId = signal<string>('');
  protected readonly weightInput = signal<string>('');
  protected readonly date = signal<Date | null>(new Date());

  protected readonly weightKg = computed(() => {
    const parsed = Number.parseFloat(this.weightInput().replace(',', '.'));
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  });

  protected readonly canSubmit = computed(
    () => isCropId(this.cropId()) && this.weightKg() !== null && this.date() !== null,
  );

  protected onCropChange(value: string | string[] | null): void {
    if (typeof value !== 'string') {
      return;
    }
    this.cropId.set(value);
  }

  protected onWeightInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.weightInput.set(target.value);
  }

  protected onSave(): void {
    const cropId = this.cropId();
    const weightKg = this.weightKg();
    const harvestedOn = this.date();
    if (!isCropId(cropId) || weightKg === null || harvestedOn === null) {
      return;
    }
    this.store.add({ cropId, weightKg, harvestedOn });
    this.#router.navigateByUrl(HARVESTS_LINK);
  }
}
