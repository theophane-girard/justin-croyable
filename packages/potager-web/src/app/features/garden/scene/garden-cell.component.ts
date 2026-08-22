import {
  ChangeDetectionStrategy,
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  input,
  output,
} from '@angular/core';
import { outputFromObservable } from '@angular/core/rxjs-interop';
import { SceneThemeService } from '@justin-croyable/design-system';
import { ScenePartComponent } from '@justin-croyable/design-system/components/scene';
import { type NgtThreeEvent } from 'angular-three';
import { map, Subject, switchMap, takeUntil, tap, timer } from 'rxjs';

import { type GardenCell } from './garden-layout';
import { type GardenColors, GARDEN_PALETTE } from './garden-palette';
import { buildCellParts } from './garden-structure-parts';
import { GardenPlantComponent } from './garden-plant.component';

const LONG_PRESS_MS = 420;
const DRAG_TOLERANCE_PX = 6;

@Component({
  selector: 'app-garden-cell',
  imports: [ScenePartComponent, GardenPlantComponent],
  template: `
    <ngt-group
      [position]="cell().position"
      (click)="onPick($event)"
      (pointerdown)="onPressStart($event)"
      (pointerup)="onPressEnd()"
      (pointermove)="onPressMove($event)"
      (pointerover)="onEnter($event)"
      (pointerout)="onLeave($event)"
    >
      @for (part of parts(); track part.id) {
        <app-scene-part [part]="part" />
      }
      @if (cell().cropId; as cropId) {
        @if (cell().plant; as plant) {
          <app-garden-plant [cropId]="cropId" [spot]="plant" />
        }
      }
    </ngt-group>
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GardenCellComponent {
  readonly cell = input.required<GardenCell>();
  readonly soilTop = input.required<number>();
  readonly hovered = input(false);
  readonly selected = input(false);

  readonly picked = output<GardenCell>();
  readonly hoverChange = output<string | null>();

  readonly #colors = inject(SceneThemeService).palette(GARDEN_PALETTE);

  readonly #pressed$ = new Subject<GardenCell>();
  readonly #released$ = new Subject<void>();

  /**
   * L'appui maintenu ouvre la sélection multiple. Le clic qui suit le relâchement
   * est ignoré, sinon la feuille de semis s'ouvrirait par-dessus la sélection.
   */
  readonly #longPress$ = this.#pressed$.pipe(
    switchMap(cell =>
      timer(LONG_PRESS_MS).pipe(
        map(() => cell),
        takeUntil(this.#released$),
      ),
    ),
    tap(() => (this.#pressHandled = true)),
  );

  readonly longPressed = outputFromObservable(this.#longPress$);

  #pressHandled = false;
  #pressX = 0;
  #pressY = 0;

  protected readonly parts = computed(() => {
    const colors = this.#colors();
    const cell = this.cell();
    const empty = cell.varietyId === null;
    const tile = this.#tileColor(colors, empty);
    return buildCellParts(cell.width, cell.depth, this.soilTop(), tile);
  });

  #tileColor(colors: GardenColors, empty: boolean): string {
    if (this.selected()) {
      return colors.marker;
    }
    if (this.hovered()) {
      return colors.highlight;
    }
    return empty ? colors.bedFurrow : colors.bedSoil;
  }

  protected onPick(event: NgtThreeEvent<MouseEvent>): void {
    event.stopPropagation();
    if (this.#pressHandled || this.#travel(event.nativeEvent) > DRAG_TOLERANCE_PX) {
      this.#pressHandled = false;
      return;
    }
    this.picked.emit(this.cell());
  }

  protected onPressStart(event: NgtThreeEvent<PointerEvent>): void {
    event.stopPropagation();
    this.#pressHandled = false;
    this.#pressX = event.nativeEvent.clientX;
    this.#pressY = event.nativeEvent.clientY;
    this.#pressed$.next(this.cell());
  }

  protected onPressMove(event: NgtThreeEvent<PointerEvent>): void {
    if (this.#travel(event.nativeEvent) > DRAG_TOLERANCE_PX) {
      this.onPressEnd();
    }
  }

  protected onPressEnd(): void {
    this.#released$.next();
  }

  #travel(event: MouseEvent): number {
    return Math.hypot(event.clientX - this.#pressX, event.clientY - this.#pressY);
  }

  protected onEnter(event: NgtThreeEvent<PointerEvent>): void {
    event.stopPropagation();
    this.hoverChange.emit(this.cell().key);
  }

  protected onLeave(event: NgtThreeEvent<PointerEvent>): void {
    event.stopPropagation();
    this.hoverChange.emit(null);
  }
}
