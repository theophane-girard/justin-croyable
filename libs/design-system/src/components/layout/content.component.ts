import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';

import type { ClassValue } from 'clsx';

import { contentBodyVariants, contentSpacerVariants, contentVariants } from './layout.variants';
import { mergeClasses } from '../../utils/merge-classes';

@Component({
  selector: 'app-content',
  template: `
    <main [class]="bodyClasses">
      <ng-content />
      @if (spacer()) {
        <div [class]="spacerClasses" aria-hidden="true"></div>
      }
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'classes()',
  },
})
export class ContentComponent {
  readonly class = input<ClassValue>('');

  /** Une page qui occupe exactement la hauteur disponible coupe la cale de fin. */
  readonly spacer = input(true);

  protected readonly bodyClasses = contentBodyVariants();
  protected readonly spacerClasses = contentSpacerVariants();

  protected readonly classes = computed(() => mergeClasses(contentVariants(), this.class()));
}
