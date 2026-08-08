import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

import { SkBlockComponent } from '../skeleton/sk-block.component';
import { SkLineComponent } from '../skeleton/sk-line.component';
import { SkTextComponent } from '../skeleton/sk-text.component';

@Component({
  selector: 'app-generic-skeleton',
  imports: [SkLineComponent, SkTextComponent, SkBlockComponent],
  template: `
    <sk-line height="h-7" width="w-48" />
    <sk-text [lines]="2" class="max-w-lg" />
    <sk-block height="h-64" />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'flex flex-col gap-4',
  },
})
export class GenericSkeletonComponent {}
