import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  contentChildren,
  inject,
  input,
  TemplateRef,
  ViewEncapsulation,
} from '@angular/core';
import { type Params, RouterLink } from '@angular/router';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronRight, lucideEllipsis } from '@ng-icons/lucide';
import type { ClassValue } from 'clsx';

import {
  breadcrumbEllipsisVariants,
  breadcrumbItemVariants,
  breadcrumbListVariants,
  breadcrumbVariants,
  type BreadcrumbAlignVariants,
  type BreadcrumbEllipsisColorVariants,
  type BreadcrumbSizeVariants,
  type BreadcrumbWrapVariants,
} from './breadcrumb.variants';
import { StringTemplateOutletDirective } from '../../core/directives/string-template-outlet/string-template-outlet.directive';
import { mergeClasses } from '../../utils/merge-classes';

@Component({
  selector: 'app-breadcrumb-ellipsis, [app-breadcrumb-ellipsis]',
  imports: [NgIcon],
  template: `
    <ng-icon name="lucideEllipsis" class="size-4!" />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  viewProviders: [provideIcons({ lucideEllipsis })],
  host: {
    '[class]': 'classes()',
    'aria-hidden': 'true',
    role: 'presentation',
  },
  exportAs: 'breadcrumbEllipsis',
})
export class BreadcrumbEllipsisComponent {
  readonly color = input<BreadcrumbEllipsisColorVariants>('muted');

  readonly class = input<ClassValue>('');
  protected readonly classes = computed(() =>
    mergeClasses(breadcrumbEllipsisVariants({ color: this.color() }), this.class()),
  );
}

@Component({
  selector: 'app-breadcrumb-item, [app-breadcrumb-item]',
  imports: [StringTemplateOutletDirective, NgIcon, RouterLink],
  template: `
    <ng-template #itemContent><ng-content /></ng-template>

    <li [class]="classes()">
      @if (isEllipsis()) {
        <ng-container *appStringTemplateOutlet="itemContent" />
      } @else {
        <a
          class="flex items-center gap-1.5"
          [routerLink]="link()"
          [queryParams]="queryParams()"
          [fragment]="fragment()"
        >
          <ng-container *appStringTemplateOutlet="itemContent" />
        </a>
      }
    </li>

    @if (!isLast()) {
      <li aria-hidden="true" role="presentation" [class]="separatorClasses()" (click)="$event.stopPropagation()">
        @if (isTemplate(separator())) {
          <ng-container *appStringTemplateOutlet="separator()" />
        } @else if (separator()) {
          {{ separator() }}
        } @else {
          <span class="flex items-center">
            <ng-icon name="lucideChevronRight" />
          </span>
        }
      </li>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  viewProviders: [provideIcons({ lucideChevronRight })],
  host: {
    class: 'inline-flex items-center gap-1.5',
  },
  exportAs: 'breadcrumbItem',
})
export class BreadcrumbItemComponent {
  private readonly breadcrumbComponent = inject(BreadcrumbComponent);

  private readonly content = contentChild(BreadcrumbEllipsisComponent);
  /*
    These inputs feed the inner anchor link. The public navigation input is
    named `link` (not `routerLink`) on purpose: it avoids Angular's RouterLink
    directive also matching the host element via its `[routerLink]` selector,
    which would otherwise clash when a consumer imports RouterLink in scope.
  */
  readonly link = input<string[]>([]);
  readonly queryParams = input<Params | null | undefined>();
  readonly fragment = input<string | undefined>();

  readonly class = input<ClassValue>('');

  protected readonly separator = computed(() => this.breadcrumbComponent.separator());
  protected readonly isLast = computed<boolean>(() => this === this.breadcrumbComponent.items().at(-1));
  protected readonly isEllipsis = computed<boolean>(() => this.content() !== undefined);

  protected readonly classes = computed(() => mergeClasses(breadcrumbItemVariants(), this.class()));
  protected readonly separatorClasses = computed(
    () => 'text-muted-foreground [&_svg]:size-3.5 [&_ng-icon]:flex! [&_ng-icon]:items-center!',
  );

  protected isTemplate(value: string | TemplateRef<void>): value is TemplateRef<void> {
    return value instanceof TemplateRef;
  }
}

@Component({
  selector: 'app-breadcrumb, [app-breadcrumb]',
  template: `
    <nav aria-label="breadcrumb" [class]="navClasses()">
      <ol [class]="listClasses()">
        <ng-content />
      </ol>
    </nav>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'breadcrumb',
})
export class BreadcrumbComponent {
  readonly size = input<BreadcrumbSizeVariants>('md');
  readonly align = input<BreadcrumbAlignVariants>('start');
  readonly wrap = input<BreadcrumbWrapVariants>('wrap');
  readonly separator = input<string | TemplateRef<void>>('');

  readonly class = input<ClassValue>('');

  readonly items = contentChildren(BreadcrumbItemComponent);

  protected readonly navClasses = computed(() =>
    mergeClasses(breadcrumbVariants({ size: this.size() }), this.class()),
  );

  protected readonly listClasses = computed(() =>
    breadcrumbListVariants({ align: this.align(), wrap: this.wrap() }),
  );
}
