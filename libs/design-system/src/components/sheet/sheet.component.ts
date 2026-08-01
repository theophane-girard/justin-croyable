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
  signal,
  type TemplateRef,
  type Type,
  viewChild,
  type ViewContainerRef,
} from '@angular/core';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideX } from '@ng-icons/lucide';

import { ButtonComponent } from '../button';
import { mergeClasses, noopFn } from '../../utils/merge-classes';

import type { SheetRef } from './sheet-ref';
import { sheetVariants, type SheetVariants } from './sheet.variants';

export type OnClickCallback<T> = (instance: T) => false | void | object;
export class SheetOptions<T, U> {
  cancelIcon?: string;
  cancelText?: string | null;
  closable?: boolean;
  content?: string | TemplateRef<T> | Type<T>;
  customClasses?: string;
  data?: U;
  description?: string;
  height?: string;
  hideFooter?: boolean;
  maskClosable?: boolean;
  okDestructive?: boolean;
  okDisabled?: boolean;
  okIcon?: string;
  okText?: string | null;
  onCancel?: EventEmitter<T> | OnClickCallback<T> = noopFn;
  onOk?: EventEmitter<T> | OnClickCallback<T> = noopFn;
  side?: SheetVariants['side'] = 'left';
  size?: SheetVariants['size'] = 'default';
  title?: string | TemplateRef<T>;
  viewContainerRef?: ViewContainerRef;
  width?: string;
}

@Component({
  selector: 'app-sheet',
  imports: [OverlayModule, PortalModule, ButtonComponent, NgIcon],
  template: `
    @if (config.closable || config.closable === undefined) {
      <button
        type="button"
        data-testid="app-close-header-button"
        appButton
        variant="ghost"
        size="sm"
        class="absolute top-1 right-1 cursor-pointer"
        (click)="onCloseClick()"
      >
        <ng-icon name="lucideX" />
      </button>
    }

    @if (config.title || config.description) {
      <header data-slot="sheet-header" class="flex flex-col gap-1.5 p-4">
        @if (config.title) {
          <h4 data-testid="app-title" data-slot="sheet-title" class="text-lg leading-none font-semibold tracking-tight">
            {{ config.title }}
          </h4>

          @if (config.description) {
            <p data-testid="app-description" data-slot="sheet-description" class="text-muted-foreground text-sm">
              {{ config.description }}
            </p>
          }
        }
      </header>
    }

    <main class="flex w-full flex-col space-y-4">
      <ng-template cdkPortalOutlet />

      @if (isStringContent) {
        <div data-testid="app-content" data-slot="sheet-content" [innerHTML]="config.content"></div>
      }
    </main>

    @if (!config.hideFooter) {
      <footer data-slot="sheet-footer" class="mt-auto flex flex-col gap-2 p-4">
        @if (config.okText !== null) {
          <button
            type="button"
            data-testid="app-ok-button"
            class="cursor-pointer"
            appButton
            [variant]="config.okDestructive ? 'destructive' : 'default'"
            [buttonDisabled]="config.okDisabled"
            (click)="onOkClick()"
          >
            @if (config.okIcon) {
              <ng-icon [svg]="config.okIcon" />
            }

            {{ config.okText ?? 'OK' }}
          </button>
        }

        @if (config.cancelText !== null) {
          <button
            type="button"
            data-testid="app-cancel-button"
            class="cursor-pointer"
            appButton
            variant="outline"
            (click)="onCloseClick()"
          >
            @if (config.cancelIcon) {
              <ng-icon [svg]="config.cancelIcon" />
            }

            {{ config.cancelText ?? 'Cancel' }}
          </button>
        }
      </footer>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [provideIcons({ lucideX })],
  host: {
    'data-slot': 'sheet',
    '[class]': 'classes()',
    '[attr.data-state]': 'state()',
    '[style.width]': 'config.width ? config.width + " !important" : null',
    '[style.height]': 'config.height ? config.height + " !important" : null',
  },
  exportAs: 'appSheet',
})
export class SheetComponent<T, U> extends BasePortalOutlet {
  private readonly host = inject(ElementRef<HTMLElement>);
  protected readonly config = inject(SheetOptions<T, U>);

  protected readonly classes = computed(() => {
    const size = this.config.width || this.config.height ? 'custom' : this.config.size;

    return mergeClasses(
      sheetVariants({
        side: this.config.side,
        size,
      }),
      this.config.customClasses,
    );
  });

  sheetRef?: SheetRef<T>;

  protected readonly isStringContent = typeof this.config.content === 'string';

  readonly portalOutlet = viewChild.required(CdkPortalOutlet);

  readonly okTriggered = output<void>();
  readonly cancelTriggered = output<void>();
  readonly state = signal<'closed' | 'open'>('closed');

  constructor() {
    super();
  }

  getNativeElement(): HTMLElement {
    return this.host.nativeElement;
  }

  attachComponentPortal<T>(portal: ComponentPortal<T>): ComponentRef<T> {
    if (this.portalOutlet()?.hasAttached()) {
      throw new Error('Attempting to attach modal content after content is already attached');
    }
    return this.portalOutlet()?.attachComponentPortal(portal);
  }

  attachTemplatePortal<C>(portal: TemplatePortal<C>): EmbeddedViewRef<C> {
    if (this.portalOutlet()?.hasAttached()) {
      throw new Error('Attempting to attach modal content after content is already attached');
    }

    return this.portalOutlet()?.attachTemplatePortal(portal);
  }

  onOkClick() {
    this.okTriggered.emit();
  }

  onCloseClick() {
    this.cancelTriggered.emit();
  }
}
