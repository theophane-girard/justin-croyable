import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import type { CreateVarietyPricePayload } from '@justin-croyable/api-contract';

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

import { CROP_BY_ID } from '../../core/potager.model';
import { CatalogStore } from '../../core/catalog-store';
import { PriceStore } from '../../core/price-store';
import { UserStore } from '../../core/user-store';
import { ADMIN_PRICES_LINK } from '../../app.routes';

type PriceOption = { readonly value: string; readonly label: string };

const DEFAULT_SOURCE = 'manuel';

const SOURCE_OPTIONS: readonly PriceOption[] = [
  { value: 'manuel', label: 'Manuel' },
  { value: 'rnm', label: 'RNM' },
  { value: 'reference', label: 'Référence' },
];

function parsePrice(raw: string): number | null {
  const parsed = Number.parseFloat(raw.replace(',', '.'));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

@Component({
  selector: 'app-add-price',
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
    @if (!isAdmin()) {
      <app-empty
        icon="phosphorLock"
        title="Accès réservé"
        description="Cette page est réservée aux administrateurs."
      />
    } @else {
      <div class="mx-auto flex w-full max-w-2xl flex-col gap-4">
        <div class="flex items-center justify-between gap-2">
          <div class="flex flex-col">
            <h2 class="text-foreground text-lg font-semibold">Nouveau prix</h2>
            <p class="text-muted-foreground text-sm">
              Prix par variété utilisé pour valoriser les récoltes.
            </p>
          </div>
          <div class="flex items-center gap-2">
            <a appButton variant="outline" [routerLink]="pricesLink">Annuler</a>
            <button appButton [buttonDisabled]="!canSubmit()" (click)="onSave()">
              <ng-icon name="phosphorPlus" class="size-4" />
              Enregistrer
            </button>
          </div>
        </div>

        <app-card>
          <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
            <app-select
              label="Variété"
              placeholder="Sélectionner une variété…"
              [required]="true"
              [value]="varietyId()"
              (valueChange)="onVarietyChange($event)"
            >
              @for (option of varietyOptions(); track option.value) {
                <app-select-item [value]="option.value">{{ option.label }}</app-select-item>
              }
            </app-select>

            <app-select label="Source" [value]="source()" (valueChange)="onSourceChange($event)">
              @for (option of sourceOptions; track option.value) {
                <app-select-item [value]="option.value">{{ option.label }}</app-select-item>
              }
            </app-select>

            <app-input-group label="Prix conventionnel" hint="En €/kg." [required]="true">
              <input
                app-input
                type="number"
                inputmode="decimal"
                min="0"
                step="0.1"
                placeholder="0"
                [value]="conventionalInput()"
                (input)="onConventionalInput($event)"
              />
            </app-input-group>

            <app-input-group label="Prix bio" hint="En €/kg, optionnel.">
              <input
                app-input
                type="number"
                inputmode="decimal"
                min="0"
                step="0.1"
                placeholder="—"
                [value]="bioInput()"
                (input)="onBioInput($event)"
              />
            </app-input-group>

            <div class="flex flex-col gap-2 md:col-span-2">
              <label class="text-sm font-medium">Date effective</label>
              <app-date-picker
                placeholder="Choisir une date"
                format="d MMMM yyyy"
                type="outline"
                [value]="effectiveFrom()"
                (valueChange)="effectiveFrom.set($event)"
              />
            </div>
          </div>
        </app-card>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddPriceComponent {
  readonly #prices = inject(PriceStore);
  readonly #catalog = inject(CatalogStore);
  readonly #users = inject(UserStore);
  readonly #router = inject(Router);

  protected readonly isAdmin = this.#users.isAdmin;
  protected readonly pricesLink = ADMIN_PRICES_LINK;
  protected readonly varietyOptions = computed<readonly PriceOption[]>(() =>
    [...this.#catalog.references()]
      .map(variety => ({
        value: variety.id,
        label: `${CROP_BY_ID[variety.cropId].label} · ${variety.label}`,
      }))
      .sort((first, second) => first.label.localeCompare(second.label, 'fr')),
  );
  protected readonly sourceOptions = SOURCE_OPTIONS;

  protected readonly varietyId = signal<string>('');
  protected readonly conventionalInput = signal<string>('');
  protected readonly bioInput = signal<string>('');
  protected readonly source = signal<string>(DEFAULT_SOURCE);
  protected readonly effectiveFrom = signal<Date | null>(new Date());

  readonly #conventional = computed(() => parsePrice(this.conventionalInput()));
  readonly #bio = computed(() =>
    this.bioInput().trim() === '' ? null : parsePrice(this.bioInput()),
  );

  protected readonly canSubmit = computed(
    () =>
      this.#catalog.isKnown(this.varietyId()) &&
      this.#conventional() !== null &&
      this.effectiveFrom() !== null,
  );

  protected onVarietyChange(value: string | string[] | null): void {
    if (typeof value === 'string') {
      this.varietyId.set(value);
    }
  }

  protected onSourceChange(value: string | string[] | null): void {
    if (typeof value === 'string') {
      this.source.set(value);
    }
  }

  protected onConventionalInput(event: Event): void {
    this.conventionalInput.set((event.target as HTMLInputElement).value);
  }

  protected onBioInput(event: Event): void {
    this.bioInput.set((event.target as HTMLInputElement).value);
  }

  protected onSave(): void {
    const conventionalPricePerKg = this.#conventional();
    const effectiveFrom = this.effectiveFrom();
    const varietyId = this.varietyId();
    if (conventionalPricePerKg === null || effectiveFrom === null || !this.#catalog.isKnown(varietyId)) {
      return;
    }
    const payload: CreateVarietyPricePayload = {
      varietyId,
      conventionalPricePerKg,
      bioPricePerKg: this.#bio(),
      effectiveFrom: effectiveFrom.toISOString(),
      source: this.source(),
    };
    void this.#prices.createPrice(payload).then(succeeded => {
      if (succeeded) {
        void this.#router.navigateByUrl(ADMIN_PRICES_LINK);
      }
    });
  }
}
