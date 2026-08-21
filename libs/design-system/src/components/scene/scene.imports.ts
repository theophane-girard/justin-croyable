import { SceneCanvasComponent, SceneContentDirective } from './scene-canvas.component';
import { SceneEnvironmentComponent } from './scene-environment.component';
import { SceneOrbitControlsComponent } from './scene-orbit-controls.component';
import { ScenePartComponent } from './scene-part.component';

export const SceneImports = [
  SceneCanvasComponent,
  SceneContentDirective,
  SceneEnvironmentComponent,
  SceneOrbitControlsComponent,
  ScenePartComponent,
] as const;
