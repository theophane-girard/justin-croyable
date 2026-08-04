import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';

import type { ClassValue } from 'clsx';

import { mergeClasses } from '../../utils/merge-classes';

import { FabContainerComponent } from './fab-container.component';
import { fabListVariants, type FabListSide } from './fab-button.variants';

@Component({
  selector: 'app-fab-list',
  imports: [],
  template: `<ng-content />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'classes()',
    '[attr.aria-hidden]': '!container.open()',
    '(click)': 'onSelect()',
  },
})
export class FabListComponent {
  protected readonly container = inject(FabContainerComponent);

  readonly side = input<FabListSide>('top');
  readonly closeOnSelect = input(true, { transform: booleanAttribute });
  readonly class = input<ClassValue>('');

  protected readonly classes = computed(() =>
    mergeClasses(
      fabListVariants({ side: this.side(), open: this.container.open() }),
      this.class(),
    ),
  );

  protected onSelect(): void {
    if (this.closeOnSelect()) {
      this.container.close();
    }
  }
}
