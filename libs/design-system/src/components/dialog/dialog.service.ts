import { type ComponentType, Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal, TemplatePortal } from '@angular/cdk/portal';
import { isPlatformBrowser } from '@angular/common';
import {
  inject,
  Injectable,
  InjectionToken,
  Injector,
  PLATFORM_ID,
  TemplateRef,
  type ViewContainerRef,
} from '@angular/core';

import { DialogRef } from './dialog-ref';
import { DialogComponent, DialogOptions } from './dialog.component';

type ContentType<T> = ComponentType<T> | TemplateRef<T> | string;

export const MODAL_DATA = new InjectionToken<unknown>('MODAL_DATA');

/**
 * Type-safe accessor for the data passed to a dialog via {@link DialogOptions.data}.
 *
 * Must be called from an injection context (component constructor / field initializer).
 *
 * @example
 * private readonly data = injectDialogData<MyData>();
 */
export function injectDialogData<T>(): T {
  return inject(MODAL_DATA) as T;
}

@Injectable({
  providedIn: 'root',
})
export class DialogService {
  private readonly overlay = inject(Overlay);
  private readonly injector = inject(Injector);
  private readonly platformId = inject(PLATFORM_ID);

  /**
   * Opens a dialog with the given configuration.
   *
   * On non-browser platforms (SSR / build) the returned `DialogRef` is a
   * no-op that resolves cleanly when calling `close()`.
   */
  create<T, U = unknown>(config: DialogOptions<T, U>): DialogRef<T> {
    if (!isPlatformBrowser(this.platformId)) {
      return new DialogRef<T>(null, config, null, this.platformId);
    }

    const overlayRef = this.createOverlay();
    const dialogContainer = this.attachDialogContainer<T, U>(overlayRef, config);
    const dialogRef = this.attachDialogContent<T, U>(
      config.content as ContentType<T>,
      dialogContainer,
      overlayRef,
      config,
    );

    dialogContainer.dialogRef = dialogRef;

    return dialogRef;
  }

  private createOverlay(): OverlayRef {
    return this.overlay.create(
      new OverlayConfig({
        hasBackdrop: true,
        backdropClass: ['bg-black/10', 'supports-backdrop-filter:backdrop-blur-xs'],
        positionStrategy: this.overlay.position().global(),
      }),
    );
  }

  private attachDialogContainer<T, U>(overlayRef: OverlayRef, config: DialogOptions<T, U>) {
    const injector = Injector.create({
      parent: this.injector,
      providers: [
        { provide: OverlayRef, useValue: overlayRef },
        { provide: DialogOptions, useValue: config },
      ],
    });

    const containerPortal = new ComponentPortal<DialogComponent<T, U>>(
      DialogComponent,
      config.viewContainerRef,
      injector,
    );

    return overlayRef.attach<DialogComponent<T, U>>(containerPortal).instance;
  }

  private attachDialogContent<T, U>(
    componentOrTemplateRef: ContentType<T>,
    dialogContainer: DialogComponent<T, U>,
    overlayRef: OverlayRef,
    config: DialogOptions<T, U>,
  ): DialogRef<T> {
    const dialogRef = new DialogRef<T>(overlayRef, config, dialogContainer, this.platformId);

    if (componentOrTemplateRef instanceof TemplateRef) {
      // CDK's TemplatePortal type requires a ViewContainerRef even though it tolerates null at runtime,
      // and types the template context as T (the template's data shape) — we expose `dialogRef` instead.
      const vcr = (config.viewContainerRef ?? null) as unknown as ViewContainerRef;
      const ctx = { dialogRef } as unknown as T;
      dialogContainer.attachTemplatePortal(new TemplatePortal(componentOrTemplateRef, vcr, ctx));
    } else if (typeof componentOrTemplateRef !== 'string') {
      const injector = this.createInjector<T, U>(dialogRef, config);
      const contentRef = dialogContainer.attachComponentPortal<T>(
        new ComponentPortal(componentOrTemplateRef, config.viewContainerRef, injector),
      );
      dialogRef.setComponentInstance(contentRef.instance);
    }

    return dialogRef;
  }

  private createInjector<T, U>(dialogRef: DialogRef<T>, config: DialogOptions<T, U>): Injector {
    return Injector.create({
      parent: this.injector,
      providers: [
        { provide: DialogRef, useValue: dialogRef },
        { provide: MODAL_DATA, useValue: config.data },
      ],
    });
  }
}
