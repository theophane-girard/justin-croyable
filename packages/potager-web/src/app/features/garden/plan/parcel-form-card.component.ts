import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
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

type ParcelField = 'lengthCm' | 'widthCm' | 'cellLengthCm' | 'cellWidthCm';

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
        <app-input-group label="Longueur parcelle (m)" required>
          <input
            app-input
            type="number"
            step="0.1"
            [min]="minSideMetres"
            [max]="maxSideMetres"
            [value]="lengthField()"
            (valueChange)="onLengthChange($event)"
          />
        </app-input-group>

        <app-input-group label="Largeur parcelle (m)" required>
          <input
            app-input
            type="number"
            step="0.1"
            [min]="minSideMetres"
            [max]="maxSideMetres"
            [value]="widthField()"
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
            [value]="cellLengthField()"
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
            [value]="cellWidthField()"
            (valueChange)="onCellWidthChange($event)"
          />
        </app-input-group>
      </div>

      <div class="flex items-center justify-between gap-4 px-6 pt-2">
        <div class="flex flex-col gap-0.5">
          <span class="text-sm leading-none font-medium">Surélever ?</span>
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

  /**
   * Ce que l'utilisateur a tapé, tant que cela désigne toujours la même valeur.
   *
   * La directive d'entrée réécrit le contenu de l'élément dès que `value`
   * change, ce qui replace le curseur au début. Sans ce garde-fou, effacer la
   * décimale de « 1,20 » renvoyait « 1.2 » dans le champ et déplaçait le
   * curseur ; on garde donc la saisie brute tant qu'elle vaut le même nombre.
   */
  readonly #draft = signal<Partial<Record<ParcelField, string>>>({});

  protected readonly lengthField = computed(() =>
    this.#fieldValue('lengthCm', metres(this.parcel().lengthCm)),
  );
  protected readonly widthField = computed(() =>
    this.#fieldValue('widthCm', metres(this.parcel().widthCm)),
  );
  protected readonly cellLengthField = computed(() =>
    this.#fieldValue('cellLengthCm', this.parcel().cellLengthCm),
  );
  protected readonly cellWidthField = computed(() =>
    this.#fieldValue('cellWidthCm', this.parcel().cellWidthCm),
  );

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
    this.#patch('lengthCm', value, toCentimetresFromMetres(value));
  }

  protected onWidthChange(value: NumericValue): void {
    this.#patch('widthCm', value, toCentimetresFromMetres(value));
  }

  protected onCellLengthChange(value: NumericValue): void {
    this.#patch('cellLengthCm', value, toCentimetres(value));
  }

  protected onCellWidthChange(value: NumericValue): void {
    this.#patch('cellWidthCm', value, toCentimetres(value));
  }

  protected onKindChange(raised: boolean): void {
    this.changed.emit({
      ...this.parcel(),
      kind: raised ? PARCEL_KIND.raised : PARCEL_KIND.ground,
    });
  }

  #fieldValue(field: ParcelField, current: number): string | number {
    const draft = this.#draft()[field];
    return draft !== undefined && Number(draft) === current ? draft : current;
  }

  #patch(field: ParcelField, raw: NumericValue, centimetres: number | null): void {
    this.#draft.update(draft => ({ ...draft, [field]: String(raw ?? '') }));
    if (centimetres === null) {
      return;
    }
    this.changed.emit({ ...this.parcel(), [field]: centimetres });
  }
}
