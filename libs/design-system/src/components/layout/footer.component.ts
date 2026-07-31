import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';

import type { ClassValue } from 'clsx';

import { footerVariants } from './layout.variants';
import { mergeClasses } from '../../utils/merge-classes';

@Component({
  selector: 'app-footer',
  template: `
    <footer [class]="classes()" [style.height.px]="height()">
      <ng-content />
    </footer>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  // The host is layout-transparent so the inner <footer> is the real flex/positioned
  // element — lets consumers place the footer (sticky, margins, …) via `class` without a
  // wrapper element.
  host: { class: 'contents' },
  exportAs: 'footer',
})
export class FooterComponent {
  readonly class = input<ClassValue>('');
  readonly height = input<number>(64);

  protected readonly classes = computed(() => mergeClasses(footerVariants(), this.class()));
}
