import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  linkedSignal,
  signal,
  type TemplateRef,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { ButtonComponent, SheetService } from '@justin-croyable/design-system';
import { StepperImports } from '@justin-croyable/design-system/components/stepper';
import { type SheetRef } from '@justin-croyable/design-system/components/sheet';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorArrowsClockwise,
  phosphorArrowsOutCardinal,
  phosphorPencilSimple,
  phosphorPlus,
  phosphorRuler,
  phosphorTrash,
} from '@ng-icons/phosphor-icons/regular';

import { GARDEN_LINK } from '../../../app.routes';

import { GardenPlanStore, nextParcelId } from './garden-plan-store';
import { isParcelValid, ParcelFormCardComponent } from './parcel-form-card.component';
import { ParcelPlacementComponent } from './parcel-placement.component';
import {
  centrePlacements,
  DEFAULT_CELL_CM,
  DEFAULT_PARCEL_LENGTH_CM,
  DEFAULT_PARCEL_WIDTH_CM,
  overlappingParcelIds,
  type Parcel,
  PARCEL_KIND,
  type ParcelPlacement,
  reconcilePlacements,
} from './parcel.model';

const PARCEL_STEP_INDEX = 0;
const PLACEMENT_STEP_INDEX = 1;
const PARCEL_NAME_PREFIX = 'Parcelle';

function createParcel(existing: readonly Parcel[]): Parcel {
  const id = nextParcelId(existing);
  return {
    id,
    name: `${PARCEL_NAME_PREFIX} ${existing.length + 1}`,
    lengthCm: DEFAULT_PARCEL_LENGTH_CM,
    widthCm: DEFAULT_PARCEL_WIDTH_CM,
    cellLengthCm: DEFAULT_CELL_CM,
    cellWidthCm: DEFAULT_CELL_CM,
    kind: PARCEL_KIND.ground,
  };
}

@Component({
  selector: 'app-garden-setup',
  imports: [
    ...StepperImports,
    ParcelFormCardComponent,
    ParcelPlacementComponent,
    ButtonComponent,
    NgIcon,
  ],
  template: `
    <div class="flex flex-col gap-6">
      <header class="flex flex-col gap-1">
        <h1 class="text-2xl font-semibold tracking-tight">Créer votre potager</h1>
        <p class="text-muted-foreground text-sm">
          Décrivez vos parcelles, puis disposez-les sur le terrain.
        </p>
      </header>

      <app-stepper
        linear
        finishLabel="Valider le potager"
        [selectedIndex]="stepIndex()"
        (selectedIndexChange)="stepIndex.set($event)"
        (finish)="onFinish()"
      >
        <app-step
          label="Parcelles"
          description="Dimensions et grille de culture"
          icon="phosphorRuler"
          [completed]="parcelsValid()"
        >
          <div class="flex flex-col gap-4">
            @for (parcel of parcels(); track parcel.id) {
              <app-parcel-form-card
                [parcel]="parcel"
                [removable]="parcels().length > 1"
                (changed)="onParcelChanged($event)"
                (removed)="onParcelRemoved($event)"
              />
            }

            <button
              appButton
              type="button"
              variant="outline"
              class="self-start"
              (click)="onAddParcel()"
            >
              <ng-icon name="phosphorPlus" class="size-4" />
              Rajouter une parcelle
            </button>
          </div>
        </app-step>

        <app-step
          label="Disposition"
          description="Placez vos parcelles"
          icon="phosphorArrowsOutCardinal"
          [completed]="placementValid()"
        >
          <app-parcel-placement
            [parcels]="parcels()"
            [(placements)]="placements"
            [(selectedId)]="selectedId"
            [(rotatingId)]="rotatingId"
            (menuRequested)="onParcelMenu($event)"
          />
        </app-step>
      </app-stepper>
    </div>

    <ng-template #parcelMenuSheet>
      <div class="flex flex-col gap-2 p-4">
        <button appButton type="button" variant="outline" full (click)="onRotate()">
          <ng-icon name="phosphorArrowsClockwise" class="size-4" />
          Pivoter
        </button>
        <button appButton type="button" variant="outline" full (click)="onEdit()">
          <ng-icon name="phosphorPencilSimple" class="size-4" />
          Éditer les dimensions
        </button>
        <button appButton type="button" variant="outline" full (click)="onRemoveSelected()">
          <ng-icon name="phosphorTrash" class="size-4" />
          Supprimer la parcelle
        </button>
      </div>
    </ng-template>
  `,
  viewProviders: [
    provideIcons({
      phosphorArrowsClockwise,
      phosphorArrowsOutCardinal,
      phosphorPencilSimple,
      phosphorPlus,
      phosphorRuler,
      phosphorTrash,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GardenSetupComponent {
  readonly #plan = inject(GardenPlanStore);
  readonly #router = inject(Router);
  readonly #sheet = inject(SheetService);
  readonly #openSheet = signal<SheetRef<unknown> | null>(null);

  private readonly parcelMenuTemplate = viewChild.required<TemplateRef<unknown>>('parcelMenuSheet');

  protected readonly stepIndex = signal(PARCEL_STEP_INDEX);
  protected readonly selectedId = signal<string | null>(null);
  protected readonly rotatingId = signal<string | null>(null);

  protected readonly parcels = signal<readonly Parcel[]>(
    this.#plan.parcels().length > 0 ? this.#plan.parcels() : [createParcel([])],
  );

  protected readonly placements = linkedSignal<readonly Parcel[], readonly ParcelPlacement[]>({
    source: this.parcels,
    computation: (parcels, previous) =>
      reconcilePlacements(parcels, previous?.value ?? this.#plan.placements()),
  });

  protected readonly parcelsValid = computed(
    () => this.parcels().length > 0 && this.parcels().every(isParcelValid),
  );

  protected readonly placementValid = computed(
    () =>
      this.placements().length === this.parcels().length &&
      overlappingParcelIds(this.parcels(), this.placements()).size === 0,
  );

  protected onAddParcel(): void {
    this.parcels.update(parcels => [...parcels, createParcel(parcels)]);
  }

  protected onParcelChanged(parcel: Parcel): void {
    this.parcels.update(parcels =>
      parcels.map(candidate => (candidate.id === parcel.id ? parcel : candidate)),
    );
  }

  protected onParcelRemoved(parcelId: string): void {
    this.parcels.update(parcels => parcels.filter(parcel => parcel.id !== parcelId));
    this.#clearSelection(parcelId);
  }

  protected onParcelMenu(parcelId: string): void {
    this.selectedId.set(parcelId);
    const parcel = this.parcels().find(candidate => candidate.id === parcelId);
    this.#openSheet.set(
      this.#sheet.create({
        title: parcel?.name ?? 'Parcelle',
        description: 'Que voulez-vous faire de cette parcelle ?',
        side: 'bottom',
        hideFooter: true,
        content: this.parcelMenuTemplate(),
      }),
    );
  }

  protected onRotate(): void {
    this.rotatingId.set(this.selectedId());
    this.#closeSheet();
  }

  protected onEdit(): void {
    this.rotatingId.set(null);
    this.stepIndex.set(PARCEL_STEP_INDEX);
    this.#closeSheet();
  }

  protected onRemoveSelected(): void {
    const parcelId = this.selectedId();
    this.#closeSheet();
    if (parcelId === null) {
      return;
    }
    this.onParcelRemoved(parcelId);
  }

  protected onFinish(): void {
    this.#plan.saveLayout(this.parcels(), centrePlacements(this.parcels(), this.placements()));
    void this.#router.navigateByUrl(GARDEN_LINK);
  }

  #clearSelection(parcelId: string): void {
    if (this.selectedId() === parcelId) {
      this.selectedId.set(null);
    }
    if (this.rotatingId() === parcelId) {
      this.rotatingId.set(null);
    }
  }

  #closeSheet(): void {
    this.#openSheet()?.close();
    this.#openSheet.set(null);
  }

  protected readonly placementStepIndex = PLACEMENT_STEP_INDEX;
}
