import { A11yModule } from '@angular/cdk/a11y';
import { OverlayModule } from '@angular/cdk/overlay';
import {
  BasePortalOutlet,
  CdkPortalOutlet,
  type ComponentPortal,
  PortalModule,
  type TemplatePortal,
} from '@angular/cdk/portal';
import {
  ChangeDetectionStrategy,
  Component,
  type ComponentRef,
  computed,
  ElementRef,
  type EmbeddedViewRef,
  type EventEmitter,
  inject,
  output,
  type TemplateRef,
  type Type,
  viewChild,
  type ViewContainerRef,
} from '@angular/core';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideX } from '@ng-icons/lucide';
import type { ClassValue } from 'clsx';

import { IdDirective } from '../../core';
import { mergeClasses, noopFn } from '../../utils/merge-classes';

import type { DialogRef } from './dialog-ref';
import {
  dialogDescriptionVariants,
  dialogFooterVariants,
  dialogHeaderVariants,
  dialogTitleVariants,
  dialogVariants,
} from './dialog.variants';
import { ButtonComponent } from '../button/button.component';
import type { ButtonVariant } from '../button/button.variants';

export type OnClickCallback<T> = (instance: T) => false | void | object;
export class DialogOptions<T, U> {
  cancelIcon?: string;
  cancelText?: string | null;
  closable?: boolean;
  content?: string | TemplateRef<T> | Type<T>;
  /** Classes du corps, pour en régler l'emphase. */
  contentClass?: ClassValue;
  customClasses?: ClassValue;
  data?: U;
  description?: string;
  /** Classes de la description, pour en régler l'emphase. */
  descriptionClass?: ClassValue;
  /** Animation duration (ms) used when closing. Defaults to 100 (matches CSS transition). */
  duration?: number;
  hideFooter?: boolean;
  maskClosable?: boolean;
  okDestructive?: boolean;
  okDisabled?: boolean;
  okIcon?: string;
  okText?: string | null;
  /** Variante du bouton principal. Prend le pas sur `okDestructive`. */
  okVariant?: ButtonVariant;
  onCancel?: EventEmitter<T> | OnClickCallback<T> = noopFn;
  onOk?: EventEmitter<T> | OnClickCallback<T> = noopFn;
  title?: string | TemplateRef<T>;
  viewContainerRef?: ViewContainerRef;
  width?: string;
}

@Component({
  selector: 'app-dialog',
  imports: [A11yModule, OverlayModule, PortalModule, ButtonComponent, IdDirective, NgIcon],
  template: `
    <ng-container appId="app-dialog" #idRef="appId">
      @if (config.closable || config.closable === undefined) {
        <button
          type="button"
          data-testid="app-close-header-button"
          data-slot="dialog-close"
          appButton
          variant="ghost"
          size="icon-sm"
          class="absolute top-2 right-2"
          (click)="onCloseClick()"
        >
          <ng-icon name="lucideX" class="size-4!" />
          <span class="sr-only">Close</span>
        </button>
      }

      @if (config.title || config.description) {
        <header [class]="headerClasses()" data-slot="dialog-header">
          @if (config.title) {
            <h4 data-testid="app-title" data-slot="dialog-title" [class]="titleClasses()" [id]="idRef.id() + '-title'">
              {{ config.title }}
            </h4>

            @if (config.description) {
              <p
                data-testid="app-description"
                data-slot="dialog-description"
                [class]="descriptionClasses()"
                [id]="idRef.id() + '-description'"
              >
                {{ config.description }}
              </p>
            }
          }
        </header>
      }

      <main class="flex flex-col space-y-4">
        <ng-template cdkPortalOutlet />

        @if (isStringContent()) {
          <!-- Angular auto-sanitizes [innerHTML] by default; scripts/event handlers are stripped. -->
          <div data-testid="app-content" [class]="contentClasses()" [innerHTML]="config.content"></div>
        }
      </main>

      @if (!config.hideFooter) {
        <footer [class]="footerClasses()" data-slot="dialog-footer">
          @if (config.cancelText !== null) {
            <button type="button" data-testid="app-cancel-button" appButton variant="outline" (click)="onCloseClick()">
              @if (config.cancelIcon) {
                @if (isSvgString(config.cancelIcon)) {
                  <ng-icon [svg]="config.cancelIcon" class="size-4!" />
                } @else {
                  <ng-icon [name]="config.cancelIcon" class="size-4!" />
                }
              }

              {{ config.cancelText ?? 'Cancel' }}
            </button>
          }

          @if (config.okText !== null) {
            <button
              type="button"
              data-testid="app-ok-button"
              appButton
              [variant]="config.okVariant ?? (config.okDestructive ? 'destructive' : 'default')"
              [buttonDisabled]="config.okDisabled"
              (click)="onOkClick()"
            >
              @if (config.okIcon) {
                @if (isSvgString(config.okIcon)) {
                  <ng-icon [svg]="config.okIcon" class="size-4!" />
                } @else {
                  <ng-icon [name]="config.okIcon" class="size-4!" />
                }
              }

              {{ config.okText ?? 'OK' }}
            </button>
          }
        </footer>
      }
    </ng-container>
  `,
  styles: `
    :host {
      --app-dialog-duration: 100ms;
      opacity: 1;
      transition:
        opacity var(--app-dialog-duration) ease-out,
        transform var(--app-dialog-duration) ease-out,
        translate var(--app-dialog-duration) ease-out;
    }

    @starting-style {
      :host {
        opacity: 0;
        translate: 0 100%;
      }
    }

    :host.dialog-leave {
      opacity: 0;
      translate: 0 100%;
      transition:
        opacity var(--app-dialog-duration) ease-in,
        translate var(--app-dialog-duration) ease-in;
    }

    @media (min-width: 640px) {
      @starting-style {
        :host {
          opacity: 0;
          transform: scale(0.9);
          translate: -50% -50%;
        }
      }

      :host.dialog-leave {
        opacity: 0;
        transform: scale(0.9);
        translate: -50% -50%;
        transition:
          opacity var(--app-dialog-duration) ease-in,
          transform var(--app-dialog-duration) ease-in;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [provideIcons({ lucideX })],
  host: {
    '[class]': 'classes()',
    '[style.width]': 'config.width ? config.width : null',
    '[style.--app-dialog-duration]': 'durationCss()',
    'data-slot': 'dialog-content',
    role: 'dialog',
    'aria-modal': 'true',
    '[attr.aria-labelledby]': 'titleId()',
    '[attr.aria-describedby]': 'descriptionId()',
    cdkTrapFocus: 'true',
    cdkTrapFocusAutoCapture: 'true',
  },
  exportAs: 'appDialog',
})
export class DialogComponent<T, U> extends BasePortalOutlet {
  private readonly host = inject(ElementRef<HTMLElement>);
  protected readonly config = inject(DialogOptions<T, U>);
  private readonly idRef = viewChild.required<IdDirective>('idRef');

  protected readonly classes = computed(() => mergeClasses(dialogVariants(), this.config.customClasses));
  protected readonly headerClasses = computed(() => dialogHeaderVariants());
  protected readonly titleClasses = computed(() => dialogTitleVariants());
  protected readonly descriptionClasses = computed(() =>
    mergeClasses(dialogDescriptionVariants(), this.config.descriptionClass),
  );
  protected readonly contentClasses = computed(() => mergeClasses(this.config.contentClass));
  protected readonly footerClasses = computed(() => dialogFooterVariants());
  protected readonly isStringContent = computed(() => typeof this.config.content === 'string');
  protected readonly titleId = computed(() => (this.config.title ? `${this.idRef().id()}-title` : null));
  protected readonly descriptionId = computed(() =>
    this.config.description ? `${this.idRef().id()}-description` : null,
  );

  protected readonly durationCss = computed(() =>
    this.config.duration !== undefined ? `${this.config.duration}ms` : null,
  );

  protected isSvgString(icon: string): boolean {
    return /^\s*<svg/i.test(icon);
  }

  dialogRef?: DialogRef<T>;

  readonly portalOutlet = viewChild.required(CdkPortalOutlet);

  okTriggered = output<void>();
  cancelTriggered = output<void>();

  getNativeElement(): HTMLElement {
    return this.host.nativeElement;
  }

  attachComponentPortal<C>(portal: ComponentPortal<C>): ComponentRef<C> {
    if (this.portalOutlet().hasAttached()) {
      throw new Error('Attempting to attach modal content after content is already attached');
    }
    return this.portalOutlet().attachComponentPortal(portal);
  }

  attachTemplatePortal<C>(portal: TemplatePortal<C>): EmbeddedViewRef<C> {
    if (this.portalOutlet().hasAttached()) {
      throw new Error('Attempting to attach modal content after content is already attached');
    }
    return this.portalOutlet().attachTemplatePortal(portal);
  }

  onOkClick() {
    this.okTriggered.emit();
  }

  onCloseClick() {
    this.cancelTriggered.emit();
  }
}
