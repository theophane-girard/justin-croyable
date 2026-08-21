import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import {
  BadgeComponent,
  ButtonComponent,
  CardComponent,
  SwitchComponent,
} from '@justin-croyable/design-system';
import { InputDirective } from '@justin-croyable/design-system/components/input';
import { InputGroupComponent } from '@justin-croyable/design-system/components/input-group';
import { NgIcon } from '@ng-icons/core';

import {
  formatMetres,
  gridLabel,
  MAX_CELL_CM,
  MAX_SIDE_CM,
  MIN_CELL_CM,
  MIN_SIDE_CM,
  metres,
  type Parcel,
  PARCEL_KIND,
  parcelFootprint,
} from './parcel.model';

const CENTIMETRES_PER_METRE = 100;

type NumericValue = string | number | null | undefined;

function toCentimetresFromMetres(value: NumericValue): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return Math.round(parsed * CENTIMETRES_PER_METRE);
}

function toCentimetres(value: NumericValue): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
}

export function isParcelValid(parcel: Parcel): boolean {
  const withinSide = (value: number): boolean => value >= MIN_SIDE_CM && value <= MAX_SIDE_CM;
  const withinCell = (value: number): boolean => value >= MIN_CELL_CM && value <= MAX_CELL_CM;
  return (
    parcel.name.trim().length > 0 &&
    withinSide(parcel.lengthCm) &&
    withinSide(parcel.widthCm) &&
    withinCell(parcel.cellLengthCm) &&
    withinCell(parcel.cellWidthCm) &&
    parcel.cellLengthCm <= parcel.lengthCm &&
    parcel.cellWidthCm <= parcel.widthCm
  );
}

@Component({
  selector: 'app-parcel-form-card',
  imports: [
    CardComponent,
    ButtonComponent,
    BadgeComponent,
    SwitchComponent,
    InputDirective,
    InputGroupComponent,
    NgIcon,
  ],
  template: `
    <app-card>
      <div class="flex items-start justify-between gap-3 px-6 pb-1">
        <div class="flex min-w-0 flex-col gap-1">
          <p class="truncate text-sm font-medium">{{ parcel().name }}</p>
          <div class="flex flex-wrap items-center gap-1.5">
            <app-badge type="secondary">{{ grid() }}</app-badge>
            <app-badge type="outline">{{ surface() }}</app-badge>
          </div>
        </div>

        @if (removable()) {
          <button
            appButton
            type="button"
            variant="ghost"
            size="sm"
            aria-label="Retirer la parcelle"
            (click)="removed.emit(parcel().id)"
          >
            <ng-icon name="phosphorTrash" class="size-4" />
          </button>
        }
      </div>

      <div class="grid grid-cols-1 gap-4 px-6 sm:grid-cols-2">
        <app-input-group label="Longueur (m)" required>
          <input
            app-input
            type="number"
            step="0.1"
            [min]="minSideMetres"
            [max]="maxSideMetres"
            [value]="lengthMetres()"
            (valueChange)="onLengthChange($event)"
          />
        </app-input-group>

        <app-input-group label="Largeur (m)" required>
          <input
            app-input
            type="number"
            step="0.1"
            [min]="minSideMetres"
            [max]="maxSideMetres"
            [value]="widthMetres()"
            (valueChange)="onWidthChange($event)"
          />
        </app-input-group>

        <app-input-group label="Longueur d’une case (cm)" hint="Sens de la longueur." required>
          <input
            app-input
            type="number"
            step="1"
            [min]="minCell"
            [max]="maxCell"
            [value]="parcel().cellLengthCm"
            (valueChange)="onCellLengthChange($event)"
          />
        </app-input-group>

        <app-input-group label="Largeur d’une case (cm)" hint="Sens de la largeur." required>
          <input
            app-input
            type="number"
            step="1"
            [min]="minCell"
            [max]="maxCell"
            [value]="parcel().cellWidthCm"
            (valueChange)="onCellWidthChange($event)"
          />
        </app-input-group>
      </div>

      <div class="flex items-center justify-between gap-4 px-6">
        <div class="flex flex-col gap-0.5">
          <span class="text-sm leading-none font-medium">C’est un bac</span>
          <span class="text-muted-foreground text-xs">
            Caisson de planches surélevé, sinon culture à même la terre.
          </span>
        </div>
        <app-switch [checked]="isRaised()" (checkedChange)="onKindChange($event)" />
      </div>

      @if (!valid()) {
        <p class="text-destructive px-6 text-sm">{{ errorMessage() }}</p>
      }
    </app-card>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParcelFormCardComponent {
  readonly parcel = input.required<Parcel>();
  readonly removable = input(true);

  readonly changed = output<Parcel>();
  readonly removed = output<string>();

  protected readonly minSideMetres = metres(MIN_SIDE_CM);
  protected readonly maxSideMetres = metres(MAX_SIDE_CM);
  protected readonly minCell = MIN_CELL_CM;
  protected readonly maxCell = MAX_CELL_CM;

  protected readonly footprint = computed(() => parcelFootprint(this.parcel(), false));
  protected readonly grid = computed(() => gridLabel(this.footprint()));
  protected readonly valid = computed(() => isParcelValid(this.parcel()));
  protected readonly isRaised = computed(() => this.parcel().kind === PARCEL_KIND.raised);

  protected readonly lengthMetres = computed(() => metres(this.parcel().lengthCm));
  protected readonly widthMetres = computed(() => metres(this.parcel().widthCm));

  protected readonly surface = computed(
    () => `${formatMetres(this.parcel().widthCm)} × ${formatMetres(this.parcel().lengthCm)}`,
  );

  protected readonly errorMessage = computed(() => {
    const parcel = this.parcel();
    if (parcel.cellLengthCm > parcel.lengthCm || parcel.cellWidthCm > parcel.widthCm) {
      return 'Une case ne peut pas être plus grande que la parcelle.';
    }
    return `Longueur et largeur entre ${this.minSideMetres} m et ${this.maxSideMetres} m, cases entre ${MIN_CELL_CM} cm et ${MAX_CELL_CM} cm.`;
  });

  protected onLengthChange(value: NumericValue): void {
    this.#patch({ lengthCm: toCentimetresFromMetres(value) });
  }

  protected onWidthChange(value: NumericValue): void {
    this.#patch({ widthCm: toCentimetresFromMetres(value) });
  }

  protected onCellLengthChange(value: NumericValue): void {
    this.#patch({ cellLengthCm: toCentimetres(value) });
  }

  protected onCellWidthChange(value: NumericValue): void {
    this.#patch({ cellWidthCm: toCentimetres(value) });
  }

  protected onKindChange(raised: boolean): void {
    this.changed.emit({
      ...this.parcel(),
      kind: raised ? PARCEL_KIND.raised : PARCEL_KIND.ground,
    });
  }

  #patch(patch: Partial<Record<keyof Parcel, number | null>>): void {
    const entries = Object.entries(patch).filter(([, value]) => value !== null);
    if (entries.length === 0) {
      return;
    }
    this.changed.emit({ ...this.parcel(), ...Object.fromEntries(entries) });
  }
}
