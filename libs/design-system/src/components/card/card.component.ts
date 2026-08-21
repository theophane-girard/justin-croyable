import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  type TemplateRef,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';

import type { ClassValue } from 'clsx';

import { ButtonComponent } from '../button/button.component';
import { IdDirective, StringTemplateOutletDirective } from '../../core';
import { mergeClasses } from '../../utils/merge-classes';

import {
  type CardBackdropVariants,
  cardBodyVariants,
  cardFooterVariants,
  cardHeaderVariants,
  type CardShadowVariants,
  cardVariants,
} from './card.variants';

@Component({
  selector: 'app-card',
  imports: [StringTemplateOutletDirective, ButtonComponent, IdDirective],
  template: `
    <ng-container appId="card" #z="appId">
      @let cardTitle = title();
      @if (cardTitle) {
        <div [class]="headerClasses()" data-slot="card-header">
          <div class="leading-none font-semibold" [id]="titleId()" data-slot="card-title">
            <ng-container *appStringTemplateOutlet="cardTitle">{{ cardTitle }}</ng-container>
          </div>

          @let cardDescription = description();
          @if (cardDescription) {
            <div
              class="text-muted-foreground text-sm"
              [id]="descriptionId()"
              data-slot="card-description"
            >
              <ng-container *appStringTemplateOutlet="cardDescription">{{
                cardDescription
              }}</ng-container>
            </div>
          }

          @let cardAction = action();
          @if (cardAction) {
            <button
              appButton
              type="button"
              variant="link"
              class="col-start-2 row-span-2 row-start-1 self-start justify-self-end"
              data-slot="card-action"
              (click)="onClick()"
            >
              {{ cardAction }}
            </button>
          }
        </div>
      }

      <div [class]="bodyClasses()" data-slot="card-content">
        <ng-content />
      </div>

      <div [class]="footerClasses()" data-slot="card-footer">
        <ng-content select="[card-footer]" />
      </div>
    </ng-container>
  `,
  styles: `
    [data-slot='card-content']:empty,
    [data-slot='card-footer']:empty {
      display: none;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    'data-slot': 'card',
    '[class]': 'classes()',
    '[attr.aria-labelledby]': 'titleId()',
    '[attr.aria-describedby]': 'descriptionId()',
  },
  exportAs: 'card',
})
export class CardComponent {
  private readonly generatedId = viewChild<IdDirective>('z');

  readonly class = input<ClassValue>('');
  readonly shadow = input<CardShadowVariants>('sm');
  readonly backdrop = input<CardBackdropVariants>('opaque');
  readonly footerBorder = input(false);
  readonly headerBorder = input(false);
  readonly action = input('');
  readonly description = input<string | TemplateRef<void>>();
  readonly title = input<string | TemplateRef<void>>();

  readonly actionClick = output<void>();

  protected readonly titleId = computed(() => {
    const baseId = this.generatedId()?.id();
    return this.title() && baseId ? `${baseId}-title` : null;
  });

  protected readonly descriptionId = computed(() => {
    const baseId = this.generatedId()?.id();
    return this.description() && baseId ? `${baseId}-description` : null;
  });

  protected readonly classes = computed(() =>
    mergeClasses(
      cardVariants({ shadow: this.shadow(), backdrop: this.backdrop() }),
      this.class(),
    ),
  );
  protected readonly bodyClasses = computed(() => mergeClasses(cardBodyVariants()));
  protected readonly footerClasses = computed(() =>
    mergeClasses(cardFooterVariants(), this.footerBorder() ? 'border-t' : ''),
  );

  protected readonly headerClasses = computed(() =>
    mergeClasses(cardHeaderVariants(), this.headerBorder() ? 'border-b' : ''),
  );

  protected onClick(): void {
    this.actionClick.emit();
  }
}
