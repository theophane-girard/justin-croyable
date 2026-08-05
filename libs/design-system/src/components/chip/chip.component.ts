import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  ViewEncapsulation,
} from '@angular/core';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { phosphorX } from '@ng-icons/phosphor-icons/regular';
import type { ClassValue } from 'clsx';

import { mergeClasses } from '../../utils/merge-classes';

import { chipVariants, type ChipShape, type ChipVariant } from './chip.variants';

@Component({
  selector: 'app-chip',
  imports: [NgIcon],
  template: `
    <span class="truncate">
      <ng-content />
    </span>
    <button
      type="button"
      data-slot="chip-remove"
      [attr.aria-label]="removeLabel()"
      [disabled]="disabled()"
      (click)="onRemove($event)"
      class="ml-0.5 grid size-4 shrink-0 place-items-center rounded-full opacity-70 transition-colors hover:bg-foreground/10 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none"
    >
      <ng-icon name="phosphorX" class="size-3" aria-hidden="true" />
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  viewProviders: [provideIcons({ phosphorX })],
  host: {
    'data-slot': 'chip',
    '[class]': 'classes()',
  },
  exportAs: 'chip',
})
export class ChipComponent {
  readonly variant = input<ChipVariant>('default');
  readonly shape = input<ChipShape>('pill');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly removeLabel = input<string>('Retirer le filtre');
  readonly class = input<ClassValue>('');

  readonly removed = output<void>();

  protected readonly classes = computed(() =>
    mergeClasses(
      chipVariants({
        variant: this.variant(),
        shape: this.shape(),
        disabled: this.disabled(),
      }),
      this.class(),
    ),
  );

  protected onRemove(event: MouseEvent): void {
    event.stopPropagation();
    if (this.disabled()) {
      return;
    }
    this.removed.emit();
  }
}
