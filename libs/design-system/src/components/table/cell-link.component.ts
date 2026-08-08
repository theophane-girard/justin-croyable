import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { phosphorArrowSquareOut } from '@ng-icons/phosphor-icons/regular';
import type { ClassValue } from 'clsx';

import { mergeClasses } from '../../utils/merge-classes';
import { ButtonComponent } from '../button';

@Component({
  selector: 'app-cell-link',
  imports: [ButtonComponent, NgIcon],
  viewProviders: [provideIcons({ phosphorArrowSquareOut })],
  template: `
    <a
      appButton
      variant="link"
      [attr.href]="href()"
      target="_blank"
      rel="noopener noreferrer"
      class="h-auto min-w-0 max-w-full gap-1 p-0 text-sm font-normal"
    >
      <span class="truncate">{{ label() || href() }}</span>
      <ng-icon name="phosphorArrowSquareOut" class="size-3.5 shrink-0" aria-hidden="true" />
    </a>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'classes()',
  },
  exportAs: 'appCellLink',
})
export class CellLinkComponent {
  readonly href = input<string>('');
  readonly label = input<string>('');
  readonly class = input<ClassValue>('');

  protected readonly classes = computed(() =>
    mergeClasses('inline-flex min-w-0 max-w-full items-center', this.class()),
  );
}
