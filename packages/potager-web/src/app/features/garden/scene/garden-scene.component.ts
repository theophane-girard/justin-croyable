import {
  ChangeDetectionStrategy,
  Component,
  computed,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  input,
  output,
  ViewEncapsulation,
} from '@angular/core';
import { SceneThemeService } from '@justin-croyable/design-system';
import { ScenePartComponent } from '@justin-croyable/design-system/components/scene';

import { type GardenField } from './garden-layout';
import { GARDEN_PALETTE } from './garden-palette';
import { buildFieldParts } from './garden-structure-parts';
import { GardenBedComponent } from './garden-bed.component';

@Component({
  selector: 'app-garden-scene',
  imports: [ScenePartComponent, GardenBedComponent],
  template: `
    @for (part of fieldParts(); track part.id) {
      <app-scene-part [part]="part" />
    }

    @for (bed of field().beds; track bed.id) {
      <app-garden-bed
        [bed]="bed"
        [selected]="bed.id === selectedId()"
        [hovered]="bed.id === hoveredId()"
        (picked)="picked.emit($event)"
        (hoverChange)="hoverChange.emit($event)"
      />
    }
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GardenSceneComponent {
  readonly field = input.required<GardenField>();
  readonly selectedId = input<string | null>(null);
  readonly hoveredId = input<string | null>(null);

  readonly picked = output<string>();
  readonly hoverChange = output<string | null>();

  readonly #colors = inject(SceneThemeService).palette(GARDEN_PALETTE);

  protected readonly fieldParts = computed(() =>
    buildFieldParts(this.field().width, this.field().depth, this.#colors()),
  );
}
