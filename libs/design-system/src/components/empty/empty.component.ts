import { NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  type TemplateRef,
  ViewEncapsulation,
} from '@angular/core';

import { NgIcon } from '@ng-icons/core';
import type { ClassValue } from 'clsx';

import { StringTemplateOutletDirective } from '../../core/directives/string-template-outlet/string-template-outlet.directive';
import { mergeClasses } from '../../utils/merge-classes';

import {
  emptyActionsVariants,
  emptyDescriptionVariants,
  emptyHeaderVariants,
  emptyIconVariants,
  emptyImageVariants,
  emptyTitleVariants,
  emptyVariants,
} from './empty.variants';

@Component({
  selector: 'app-empty',
  imports: [NgOptimizedImage, NgIcon, StringTemplateOutletDirective],
  template: `
    @let imageRef = image();
    @let iconRef = icon();
    @let titleRef = title();
    @let descriptionRef = description();
    @let actionsRef = actions();

    <div [class]="headerClasses()">
      @if (imageRef) {
        <div [class]="imageClasses()">
          <ng-container *appStringTemplateOutlet="imageRef">
            <img [ngSrc]="imageRef" width="64" height="64" alt="Empty" class="mx-auto" />
          </ng-container>
        </div>
      } @else if (iconRef) {
        <div [class]="iconClasses()" data-testid="icon">
          <ng-icon [name]="iconRef" class="size-5!" />
        </div>
      }

      @if (titleRef) {
        <div [class]="titleClasses()">
          <ng-container *appStringTemplateOutlet="titleRef">{{ titleRef }}</ng-container>
        </div>
      }

      @if (descriptionRef) {
        <div [class]="descriptionClasses()">
          <ng-container *appStringTemplateOutlet="descriptionRef">{{ descriptionRef }}</ng-container>
        </div>
      }
    </div>

    @if (actionsRef.length) {
      <div [class]="actionsClasses()">
        @for (action of actionsRef; track $index) {
          <ng-container *appStringTemplateOutlet="action" />
        }
      </div>
    }

    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'classes()',
  },
  exportAs: 'empty',
})
export class EmptyComponent {
  readonly actions = input<TemplateRef<void>[]>([]);
  readonly icon = input<string>();
  readonly image = input<string | TemplateRef<void>>();
  readonly title = input<string | TemplateRef<void>>();
  readonly description = input<string | TemplateRef<void>>();
  readonly class = input<ClassValue>('');

  protected readonly classes = computed(() => mergeClasses(emptyVariants(), this.class()));
  protected readonly headerClasses = computed(() => emptyHeaderVariants());
  protected readonly imageClasses = computed(() => emptyImageVariants());
  protected readonly iconClasses = computed(() => emptyIconVariants());
  protected readonly titleClasses = computed(() => emptyTitleVariants());
  protected readonly descriptionClasses = computed(() => emptyDescriptionVariants());
  protected readonly actionsClasses = computed(() => emptyActionsVariants());
}
