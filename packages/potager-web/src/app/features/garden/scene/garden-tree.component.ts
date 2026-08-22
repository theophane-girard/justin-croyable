import {
  ChangeDetectionStrategy,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  input,
  output,
} from '@angular/core';
import { type NgtThreeEvent } from 'angular-three';

import { type GardenTree } from './garden-layout';
import { GardenPlantComponent } from './garden-plant.component';

@Component({
  selector: 'app-garden-tree',
  imports: [GardenPlantComponent],
  template: `
    <ngt-group
      [position]="tree().position"
      (click)="onPick($event)"
      (pointerover)="onEnter($event)"
      (pointerout)="onLeave($event)"
    >
      <app-garden-plant [cropId]="tree().cropId" [spot]="tree().spot" />
    </ngt-group>
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GardenTreeComponent {
  readonly tree = input.required<GardenTree>();

  readonly picked = output<GardenTree>();
  readonly hoverChange = output<string | null>();

  protected onPick(event: NgtThreeEvent<MouseEvent>): void {
    event.stopPropagation();
    this.picked.emit(this.tree());
  }

  protected onEnter(event: NgtThreeEvent<PointerEvent>): void {
    event.stopPropagation();
    this.hoverChange.emit(this.tree().id);
  }

  protected onLeave(event: NgtThreeEvent<PointerEvent>): void {
    event.stopPropagation();
    this.hoverChange.emit(null);
  }
}
