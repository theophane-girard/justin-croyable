import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, input } from '@angular/core';
import { NgtArgs } from 'angular-three';

import { PART_GEOMETRY, type ScenePart } from './scene-part';
import './three-catalogue';

const NO_METALNESS = 0;

@Component({
  selector: 'app-scene-part',
  imports: [NgtArgs],
  template: `
    <ngt-mesh [position]="part().position" [rotation]="part().rotation" [scale]="part().scale">
      @switch (part().geometry) {
        @case (geometry.box) {
          <ngt-box-geometry *args="part().args" />
        }
        @case (geometry.sphere) {
          <ngt-sphere-geometry *args="part().args" />
        }
        @case (geometry.cylinder) {
          <ngt-cylinder-geometry *args="part().args" />
        }
        @case (geometry.cone) {
          <ngt-cone-geometry *args="part().args" />
        }
        @case (geometry.capsule) {
          <ngt-capsule-geometry *args="part().args" />
        }
        @case (geometry.torus) {
          <ngt-torus-geometry *args="part().args" />
        }
        @case (geometry.circle) {
          <ngt-circle-geometry *args="part().args" />
        }
        @case (geometry.icosahedron) {
          <ngt-icosahedron-geometry *args="part().args" />
        }
      }
      <ngt-mesh-standard-material
        [color]="part().color"
        [roughness]="part().roughness"
        [metalness]="noMetalness"
        [flatShading]="part().flatShading"
      />
    </ngt-mesh>
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScenePartComponent {
  readonly part = input.required<ScenePart>();

  protected readonly geometry = PART_GEOMETRY;
  protected readonly noMetalness = NO_METALNESS;
}
