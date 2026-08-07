import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  output,
  PLATFORM_ID,
  Renderer2,
} from '@angular/core';

const EXPANDED_VIEWPORT_RATIO = 0.92;
const CLOSE_TRAVEL_THRESHOLD_PX = 96;
const EXPAND_TRAVEL_THRESHOLD_PX = 48;
const DISMISS_DURATION_MS = 200;
const SETTLE_DURATION_MS = 250;

type UnlistenFn = () => void;

@Component({
  selector: 'app-sheet-handle',
  template: `
    <span data-slot="sheet-handle-bar" class="bg-muted-foreground/40 h-1.5 w-10 rounded-full"></span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-slot': 'sheet-handle',
    class:
      'flex w-full shrink-0 touch-none cursor-grab items-center justify-center py-3 select-none active:cursor-grabbing',
    role: 'separator',
    'aria-orientation': 'horizontal',
    'aria-label': 'Faites glisser pour agrandir ou fermer',
    '(pointerdown)': 'onPointerDown($event)',
  },
})
export class SheetHandleComponent {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly platformId = inject(PLATFORM_ID);

  readonly sheetElement = input.required<HTMLElement>();
  readonly dismissed = output<void>();

  #startY = 0;
  #startHeight = 0;
  #maxExpandedPx = 0;
  #pendingTranslate = 0;
  #pendingHeight = 0;
  #grew = false;
  #expanded = false;

  #moveUnlisten: UnlistenFn | null = null;
  #upUnlisten: UnlistenFn | null = null;
  #cancelUnlisten: UnlistenFn | null = null;

  protected onPointerDown(event: PointerEvent): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const sheet = this.sheetElement();
    this.#startY = event.clientY;
    this.#startHeight = sheet.getBoundingClientRect().height;
    this.#maxExpandedPx = Math.round(window.innerHeight * EXPANDED_VIEWPORT_RATIO);
    this.#pendingTranslate = 0;
    this.#pendingHeight = this.#startHeight;
    this.#grew = false;

    this.renderer.setStyle(sheet, 'transition', 'none');
    this.#capturePointer(event.pointerId);

    const handle = this.host.nativeElement;
    this.#moveUnlisten = this.renderer.listen(handle, 'pointermove', (moveEvent: PointerEvent) =>
      this.#onPointerMove(moveEvent),
    );
    this.#upUnlisten = this.renderer.listen(handle, 'pointerup', (upEvent: PointerEvent) =>
      this.#onPointerUp(upEvent),
    );
    this.#cancelUnlisten = this.renderer.listen(handle, 'pointercancel', () => {
      this.#releaseGesture();
      this.#settleBack();
    });
  }

  #onPointerMove(event: PointerEvent): void {
    const sheet = this.sheetElement();
    const deltaY = event.clientY - this.#startY;

    if (deltaY < 0) {
      this.#grew = true;
      const target = Math.min(this.#startHeight - deltaY, this.#maxExpandedPx);
      this.#pendingHeight = target;
      this.#pendingTranslate = 0;
      this.renderer.setStyle(sheet, 'maxHeight', 'none');
      this.renderer.setStyle(sheet, 'height', `${target}px`);
      this.renderer.setStyle(sheet, 'transform', 'translateY(0)');
      return;
    }

    this.#grew = false;
    this.#pendingTranslate = deltaY;
    this.renderer.setStyle(sheet, 'transform', `translateY(${deltaY}px)`);
  }

  #onPointerUp(event: PointerEvent): void {
    this.#releaseGesture();
    this.#releasePointer(event.pointerId);

    if (this.#pendingTranslate > CLOSE_TRAVEL_THRESHOLD_PX) {
      this.#animateDismiss();
      return;
    }

    if (this.#grew && this.#pendingHeight - this.#startHeight > EXPAND_TRAVEL_THRESHOLD_PX) {
      this.#snapExpanded();
      return;
    }

    this.#settleBack();
  }

  #snapExpanded(): void {
    const sheet = this.sheetElement();
    this.#expanded = true;
    this.renderer.setStyle(sheet, 'transition', `height ${SETTLE_DURATION_MS}ms ease, transform ${SETTLE_DURATION_MS}ms ease`);
    this.renderer.setStyle(sheet, 'maxHeight', 'none');
    this.renderer.setStyle(sheet, 'height', `${this.#maxExpandedPx}px`);
    this.renderer.setStyle(sheet, 'transform', 'translateY(0)');
    this.#clearTransitionAfterEnd(sheet);
  }

  #settleBack(): void {
    const sheet = this.sheetElement();
    this.renderer.setStyle(
      sheet,
      'transition',
      `height ${SETTLE_DURATION_MS}ms ease, transform ${SETTLE_DURATION_MS}ms ease`,
    );
    this.renderer.setStyle(sheet, 'transform', 'translateY(0)');

    if (this.#expanded) {
      this.renderer.setStyle(sheet, 'maxHeight', 'none');
      this.renderer.setStyle(sheet, 'height', `${this.#maxExpandedPx}px`);
      this.#clearTransitionAfterEnd(sheet);
      return;
    }

    if (this.#grew) {
      this.renderer.setStyle(sheet, 'height', `${this.#startHeight}px`);
      this.#revertToNaturalAfterEnd(sheet);
      return;
    }

    this.#clearTransitionAfterEnd(sheet);
  }

  #animateDismiss(): void {
    const sheet = this.sheetElement();
    this.renderer.setStyle(sheet, 'transition', `transform ${DISMISS_DURATION_MS}ms ease-in`);
    this.renderer.setStyle(sheet, 'transform', 'translateY(100%)');

    const unlisten = this.renderer.listen(sheet, 'transitionend', (event: TransitionEvent) => {
      if (event.propertyName !== 'transform') {
        return;
      }
      unlisten();
      this.#resetStyles(sheet);
      this.dismissed.emit();
    });
  }

  #clearTransitionAfterEnd(sheet: HTMLElement): void {
    const unlisten = this.renderer.listen(sheet, 'transitionend', (event: TransitionEvent) => {
      if (event.propertyName !== 'transform') {
        return;
      }
      unlisten();
      this.renderer.removeStyle(sheet, 'transition');
    });
  }

  #revertToNaturalAfterEnd(sheet: HTMLElement): void {
    const unlisten = this.renderer.listen(sheet, 'transitionend', (event: TransitionEvent) => {
      if (event.propertyName !== 'height') {
        return;
      }
      unlisten();
      this.renderer.removeStyle(sheet, 'transition');
      this.renderer.removeStyle(sheet, 'height');
      this.renderer.removeStyle(sheet, 'maxHeight');
    });
  }

  #resetStyles(sheet: HTMLElement): void {
    this.renderer.removeStyle(sheet, 'transition');
    this.renderer.removeStyle(sheet, 'transform');
    this.renderer.removeStyle(sheet, 'height');
    this.renderer.removeStyle(sheet, 'maxHeight');
  }

  #capturePointer(pointerId: number): void {
    const handle = this.host.nativeElement;
    if (handle.setPointerCapture) {
      handle.setPointerCapture(pointerId);
    }
  }

  #releasePointer(pointerId: number): void {
    const handle = this.host.nativeElement;
    if (handle.hasPointerCapture?.(pointerId)) {
      handle.releasePointerCapture(pointerId);
    }
  }

  #releaseGesture(): void {
    this.#moveUnlisten?.();
    this.#upUnlisten?.();
    this.#cancelUnlisten?.();
    this.#moveUnlisten = null;
    this.#upUnlisten = null;
    this.#cancelUnlisten = null;
  }
}
