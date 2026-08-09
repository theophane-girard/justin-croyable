import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  model,
  ViewEncapsulation,
} from '@angular/core';

import { NgIcon, provideIcons, type IconName } from '@ng-icons/core';
import { phosphorPlus, phosphorX } from '@ng-icons/phosphor-icons/regular';
import type { ClassValue } from 'clsx';

import { mergeClasses } from '../../utils/merge-classes';
import { type BadgeTypeVariants } from '../badge';

import { FabButtonComponent } from './fab-button.component';
import {
  fabContainerVariants,
  type FabButtonBadge,
  type FabButtonPosition,
  type FabButtonSize,
  type FabButtonType,
} from './fab-button.variants';

@Component({
  selector: 'app-fab',
  imports: [FabButtonComponent, NgIcon],
  template: `
    <ng-content select="app-fab-list" />

    <button
      appFabButton
      type="button"
      [variant]="variant()"
      [size]="size()"
      [badge]="badge()"
      [badgeType]="badgeType()"
      [attr.aria-label]="triggerLabel()"
      [attr.aria-expanded]="open()"
      aria-haspopup="true"
      (click)="toggle()"
    >
      <span class="grid place-items-center *:[grid-area:1/1]">
        <ng-icon [name]="triggerIcon()" [class]="triggerIconClasses()" />
        <ng-icon [name]="closeIcon()" [class]="closeIconClasses()" />
      </span>
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  viewProviders: [provideIcons({ phosphorPlus, phosphorX })],
  host: {
    '[class]': 'classes()',
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'close()',
  },
  exportAs: 'fab',
})
export class FabContainerComponent {
  private readonly host =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  readonly open = model(false);
  readonly position = input<FabButtonPosition>('bottom-right');
  readonly variant = input<FabButtonType>('default');
  readonly size = input<FabButtonSize>('default');
  readonly triggerIcon = input<IconName>('phosphorPlus');
  readonly closeIcon = input<IconName>('phosphorX');
  readonly triggerLabel = input('Actions');
  readonly badge = input<FabButtonBadge>(null);
  readonly badgeType = input<BadgeTypeVariants>('destructive');
  readonly class = input<ClassValue>('');

  protected readonly classes = computed(() =>
    mergeClasses(
      fabContainerVariants({ position: this.position() }),
      this.class(),
    ),
  );

  private readonly iconTransition =
    'transition-all duration-200 ease-out motion-reduce:transition-none';

  protected readonly triggerIconClasses = computed(() =>
    mergeClasses(
      this.iconTransition,
      this.open()
        ? 'rotate-90 scale-0 opacity-0'
        : 'rotate-0 scale-100 opacity-100',
    ),
  );

  protected readonly closeIconClasses = computed(() =>
    mergeClasses(
      this.iconTransition,
      this.open()
        ? 'rotate-0 scale-100 opacity-100'
        : '-rotate-90 scale-0 opacity-0',
    ),
  );

  protected toggle(): void {
    this.open.update((value) => !value);
  }

  close(): void {
    this.open.set(false);
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (!this.open()) {
      return;
    }
    if (this.host.contains(event.target as Node)) {
      return;
    }
    this.close();
  }
}
