import { type ConnectedPosition, Overlay, OverlayPositionBuilder, type OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { isPlatformBrowser } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  InjectionToken,
  Injector,
  input,
  type OnDestroy,
  type OnInit,
  output,
  PLATFORM_ID,
  Renderer2,
  signal,
  type Signal,
  type TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';

import { filter, type Subscription } from 'rxjs';

import {
  MOBILE_SHEET_CONTENT_CLASSES,
  MOBILE_SHEET_ENTER_CLASSES,
  runMobileSheetCloseAnimation,
  ViewportService,
} from '../../core/services/viewport.service';
import { mergeClasses } from '../../utils/merge-classes';
import { SheetHandleComponent } from '../sheet-handle';

import { popoverVariants } from './popover.variants';

export type PopoverTrigger = 'click' | 'hover' | null;
export type PopoverPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface PopoverSheetContext {
  readonly isSheet: Signal<boolean>;
  readonly dismiss: () => void;
}

export const POPOVER_SHEET_CONTEXT = new InjectionToken<PopoverSheetContext>(
  'POPOVER_SHEET_CONTEXT',
);

const POPOVER_POSITIONS_MAP: { [key: string]: ConnectedPosition } = {
  top: {
    originX: 'center',
    originY: 'top',
    overlayX: 'center',
    overlayY: 'bottom',
    offsetX: 0,
    offsetY: -8,
  },
  bottom: {
    originX: 'center',
    originY: 'bottom',
    overlayX: 'center',
    overlayY: 'top',
    offsetX: 0,
    offsetY: 8,
  },
  left: {
    originX: 'start',
    originY: 'center',
    overlayX: 'end',
    overlayY: 'center',
    offsetX: -8,
    offsetY: 0,
  },
  right: {
    originX: 'end',
    originY: 'center',
    overlayX: 'start',
    overlayY: 'center',
    offsetX: 8,
    offsetY: 0,
  },
} as const;

@Directive({
  selector: '[appPopover]',
  standalone: true,
  exportAs: 'appPopover',
})
export class PopoverDirective implements OnInit, OnDestroy {
  private readonly destroyRef = inject(DestroyRef);
  private readonly overlay = inject(Overlay);
  private readonly overlayPositionBuilder = inject(OverlayPositionBuilder);
  private readonly elementRef = inject(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly viewport = inject(ViewportService);
  private readonly injector = inject(Injector);

  private overlayRef?: OverlayRef;
  private overlayRefSubscription?: Subscription;
  private readonly overlayIsSheet = signal(false);
  private listeners: (() => void)[] = [];

  private readonly sheetInjector = Injector.create({
    parent: this.injector,
    providers: [
      {
        provide: POPOVER_SHEET_CONTEXT,
        useValue: {
          isSheet: this.overlayIsSheet.asReadonly(),
          dismiss: () => this.hide(false),
        } satisfies PopoverSheetContext,
      },
    ],
  });

  readonly trigger = input<PopoverTrigger>('click');
  readonly content = input.required<TemplateRef<unknown>>();
  readonly placement = input<PopoverPlacement>('bottom');
  readonly origin = input<ElementRef>();
  readonly visible = input<boolean>(false);
  readonly overlayClickable = input<boolean>(true);
  readonly mobileSheet = input(true, { transform: booleanAttribute });
  readonly visibleChange = output<boolean>();

  private readonly isVisible = signal(false);

  get nativeElement() {
    return this.origin()?.nativeElement ?? this.elementRef.nativeElement;
  }

  constructor() {
    toObservable(this.visible)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(visible => {
        const currentlyVisible = this.isVisible();
        if (visible && !currentlyVisible) {
          this.show();
        } else if (!visible && currentlyVisible) {
          this.hide();
        }
      });

    toObservable(this.trigger)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(trigger => {
        if (this.listeners.length) {
          this.unlistenAll();
        }
        this.setupTriggers();
        this.overlayRefSubscription?.unsubscribe();
        this.overlayRefSubscription = undefined;
        if (trigger === 'click') {
          this.subscribeToOverlayRef();
        }
      });
  }

  ngOnInit() {
    this.createOverlay();
  }

  ngOnDestroy() {
    this.unlistenAll();
    this.overlayRefSubscription?.unsubscribe();
    this.overlayRef?.dispose();
  }

  show() {
    if (this.isVisible()) {
      return;
    }

    const sheet = this.sheetMode();
    if (this.overlayRef && this.overlayIsSheet() !== sheet) {
      this.overlayRefSubscription?.unsubscribe();
      this.overlayRefSubscription = undefined;
      this.overlayRef.dispose();
      this.overlayRef = undefined;
    }

    if (!this.overlayRef) {
      this.createOverlay();
      if (this.trigger() === 'click') {
        this.subscribeToOverlayRef();
      }
    }

    const templatePortal = new TemplatePortal(
      this.content(),
      this.viewContainerRef,
      undefined,
      this.sheetInjector,
    );
    this.overlayRef?.attach(templatePortal);
    this.isVisible.set(true);
    this.visibleChange.emit(true);
  }

  private sheetMode(): boolean {
    return this.mobileSheet() && this.viewport.isMobile();
  }

  hide(animate = true) {
    if (!this.isVisible()) {
      return;
    }

    if (animate && this.overlayIsSheet() && this.overlayRef?.hasAttached()) {
      const overlayRef = this.overlayRef;
      const content = overlayRef.overlayElement.firstElementChild as HTMLElement | null;
      if (content) {
        runMobileSheetCloseAnimation(content, () => {
          if (overlayRef.hasAttached()) {
            overlayRef.detach();
          }
        });
      } else {
        overlayRef.detach();
      }
    } else {
      this.overlayRef?.detach();
    }

    this.isVisible.set(false);
    this.visibleChange.emit(false);
  }

  toggle() {
    if (this.isVisible()) {
      this.hide();
    } else {
      this.show();
    }
  }

  private createOverlay() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.overlayIsSheet.set(this.sheetMode());

    if (this.overlayIsSheet()) {
      this.overlayRef = this.overlay.create({
        positionStrategy: this.overlay.position().global(),
        hasBackdrop: true,
        scrollStrategy: this.overlay.scrollStrategies.block(),
      });
      this.overlayRef
        .backdropClick()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.hide());
      return;
    }

    const positionStrategy = this.overlayPositionBuilder
      .flexibleConnectedTo(this.nativeElement)
      .withPositions(this.getPositions())
      .withPush(false)
      .withFlexibleDimensions(false)
      .withViewportMargin(8);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      hasBackdrop: false,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
    });
  }

  private subscribeToOverlayRef(): void {
    if (
      this.overlayClickable() &&
      this.trigger() === 'click' &&
      isPlatformBrowser(this.platformId) &&
      this.overlayRef
    ) {
      this.overlayRefSubscription = this.overlayRef
        .outsidePointerEvents()
        .pipe(filter(event => !this.nativeElement.contains(event.target)))
        .subscribe(() => this.hide());
    }
  }

  private setupTriggers() {
    const trigger = this.trigger();
    if (!trigger) {
      return;
    }

    if (trigger === 'click') {
      this.listeners.push(this.renderer.listen(this.nativeElement, 'click.stop', () => this.toggle()));
    } else if (trigger === 'hover') {
      this.listeners.push(this.renderer.listen(this.nativeElement, 'mouseenter', () => this.show()));

      this.listeners.push(this.renderer.listen(this.nativeElement, 'mouseleave', () => this.hide()));
    }
  }

  private unlistenAll(): void {
    for (const listener of this.listeners) {
      listener();
    }
    this.listeners = [];
  }

  private getPositions(): ConnectedPosition[] {
    const placement = this.placement();
    const positions: ConnectedPosition[] = [];

    const primaryConfig = POPOVER_POSITIONS_MAP[placement];
    positions.push({
      originX: primaryConfig.originX,
      originY: primaryConfig.originY,
      overlayX: primaryConfig.overlayX,
      overlayY: primaryConfig.overlayY,
      offsetX: primaryConfig.offsetX ?? 0,
      offsetY: primaryConfig.offsetY ?? 0,
    });

    switch (placement) {
      case 'bottom':
        positions.push({
          originX: 'center',
          originY: 'top',
          overlayX: 'center',
          overlayY: 'bottom',
          offsetX: 0,
          offsetY: -8,
        });
        positions.push({
          originX: 'end',
          originY: 'center',
          overlayX: 'start',
          overlayY: 'center',
          offsetX: 8,
          offsetY: 0,
        });
        positions.push({
          originX: 'start',
          originY: 'center',
          overlayX: 'end',
          overlayY: 'center',
          offsetX: -8,
          offsetY: 0,
        });
        break;
      case 'top':
        positions.push({
          originX: 'center',
          originY: 'bottom',
          overlayX: 'center',
          overlayY: 'top',
          offsetX: 0,
          offsetY: 8,
        });
        positions.push({
          originX: 'end',
          originY: 'center',
          overlayX: 'start',
          overlayY: 'center',
          offsetX: 8,
          offsetY: 0,
        });
        positions.push({
          originX: 'start',
          originY: 'center',
          overlayX: 'end',
          overlayY: 'center',
          offsetX: -8,
          offsetY: 0,
        });
        break;
      case 'right':
        positions.push({
          originX: 'start',
          originY: 'center',
          overlayX: 'end',
          overlayY: 'center',
          offsetX: -8,
          offsetY: 0,
        });
        positions.push({
          originX: 'center',
          originY: 'bottom',
          overlayX: 'center',
          overlayY: 'top',
          offsetX: 0,
          offsetY: 8,
        });
        positions.push({
          originX: 'center',
          originY: 'top',
          overlayX: 'center',
          overlayY: 'bottom',
          offsetX: 0,
          offsetY: -8,
        });
        break;
      case 'left':
        positions.push({
          originX: 'end',
          originY: 'center',
          overlayX: 'start',
          overlayY: 'center',
          offsetX: 8,
          offsetY: 0,
        });
        positions.push({
          originX: 'center',
          originY: 'bottom',
          overlayX: 'center',
          overlayY: 'top',
          offsetX: 0,
          offsetY: 8,
        });
        positions.push({
          originX: 'center',
          originY: 'top',
          overlayX: 'center',
          overlayY: 'bottom',
          offsetX: 0,
          offsetY: -8,
        });
        break;
    }

    return positions;
  }
}

@Component({
  selector: 'app-popover',
  imports: [SheetHandleComponent],
  standalone: true,
  template: `
    @if (isSheet()) {
      <div class="bg-popover sticky top-0 z-10">
        <app-sheet-handle [sheetElement]="hostElement" (dismissed)="onSheetDismiss()" />
        @if (sheetHeader()) {
          <div class="text-foreground border-b px-3 py-3 text-sm font-medium">
            {{ sheetHeader() }}
          </div>
        }
      </div>
    }
    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'classes()',
    '[attr.data-sheet]': 'isSheet() || null',
  },
})
export class PopoverComponent {
  readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly #sheetContext = inject(POPOVER_SHEET_CONTEXT, { optional: true });

  readonly class = input<string>('');
  readonly sheetHeader = input<string>('');
  readonly sheetDismissed = output<void>();

  protected readonly hostElement = this.elementRef.nativeElement;

  protected readonly isSheet = computed(() => this.#sheetContext?.isSheet() ?? false);

  protected readonly classes = computed(() =>
    mergeClasses(
      popoverVariants(),
      this.class(),
      this.isSheet() ? `${MOBILE_SHEET_CONTENT_CLASSES} ${MOBILE_SHEET_ENTER_CLASSES}` : '',
    ),
  );

  protected onSheetDismiss(): void {
    this.sheetDismissed.emit();
    this.#sheetContext?.dismiss();
  }
}
