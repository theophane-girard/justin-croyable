import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  output,
  PLATFORM_ID,
  Renderer2,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';

const EXPANDED_VIEWPORT_RATIO = 0.92;
const CLOSE_TRAVEL_THRESHOLD_PX = 96;
const EXPAND_TRAVEL_THRESHOLD_PX = 48;
const ENGAGE_TRAVEL_THRESHOLD_PX = 4;
const FLICK_VELOCITY_PX_PER_MS = 0.5;
const FLICK_MIN_TRAVEL_PX = 24;
const DISMISS_DURATION_MS = 200;
const SETTLE_DURATION_MS = 250;

const SCROLLABLE_OVERFLOW = ['auto', 'scroll', 'overlay'];

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
  },
})
export class SheetHandleComponent {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  readonly sheetElement = input.required<HTMLElement>();
  readonly dismissed = output<void>();

  #startY = 0;
  #startHeight = 0;
  #maxExpandedPx = 0;
  #pendingTranslate = 0;
  #pendingHeight = 0;
  #grew = false;
  #expanded = false;
  #engaged = false;
  #startedOnHandle = false;
  #scrollContainer: HTMLElement | null = null;
  #lastY = 0;
  #lastTimeStamp = 0;
  #velocity = 0;

  #startUnlisten: UnlistenFn | null = null;
  #moveUnlisten: UnlistenFn | null = null;
  #upUnlisten: UnlistenFn | null = null;
  #cancelUnlisten: UnlistenFn | null = null;
  #guardedElement: HTMLElement | null = null;

  readonly #blockNativeScroll = (event: TouchEvent): void => {
    if (this.#engaged) {
      event.preventDefault();
    }
  };

  readonly #swallowClick = (event: MouseEvent): void => {
    event.preventDefault();
    event.stopPropagation();
  };

  constructor() {
    toObservable(this.sheetElement)
      .pipe(takeUntilDestroyed())
      .subscribe(sheet => this.#listenForDragStart(sheet));

    this.destroyRef.onDestroy(() => {
      this.#releaseGesture();
      this.#startUnlisten?.();
      this.#disarmClickGuard();
      this.#detachScrollGuard();
    });
  }

  #listenForDragStart(sheet: HTMLElement): void {
    this.#startUnlisten?.();
    this.#detachScrollGuard();

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.#startUnlisten = this.renderer.listen(sheet, 'pointerdown', (event: PointerEvent) =>
      this.#onPointerDown(event),
    );
    sheet.addEventListener('touchmove', this.#blockNativeScroll, { passive: false });
    this.#guardedElement = sheet;
  }

  #detachScrollGuard(): void {
    this.#guardedElement?.removeEventListener('touchmove', this.#blockNativeScroll);
    this.#guardedElement = null;
  }

  #onPointerDown(event: PointerEvent): void {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return;
    }

    this.#releaseGesture();
    this.#disarmClickGuard();

    this.#startY = event.clientY;
    this.#lastY = event.clientY;
    this.#lastTimeStamp = event.timeStamp;
    this.#velocity = 0;
    this.#startedOnHandle = this.host.nativeElement.contains(event.target as Node);
    this.#scrollContainer = this.#findScrollContainer(event.target);

    this.#moveUnlisten = this.renderer.listen('window', 'pointermove', (moveEvent: PointerEvent) =>
      this.#onPointerMove(moveEvent),
    );
    this.#upUnlisten = this.renderer.listen('window', 'pointerup', () => this.#onPointerUp());
    this.#cancelUnlisten = this.renderer.listen('window', 'pointercancel', () => {
      const wasEngaged = this.#engaged;
      this.#releaseGesture();
      if (wasEngaged) {
        this.#settleBack();
      }
    });
  }

  #findScrollContainer(target: EventTarget | null): HTMLElement | null {
    const sheet = this.sheetElement();
    let node = target instanceof HTMLElement ? target : null;

    while (node && sheet.contains(node)) {
      if (this.#isScrollable(node)) {
        return node;
      }
      node = node.parentElement;
    }

    return null;
  }

  #isScrollable(element: HTMLElement): boolean {
    if (element.scrollHeight <= element.clientHeight) {
      return false;
    }
    return SCROLLABLE_OVERFLOW.includes(getComputedStyle(element).overflowY);
  }

  #canTakeOverGesture(deltaY: number): boolean {
    if (this.#startedOnHandle) {
      return true;
    }
    if (deltaY < 0) {
      return !this.#isAtMaxHeight();
    }
    return (this.#scrollContainer?.scrollTop ?? 0) <= 0;
  }

  #expandedHeight(): number {
    return Math.round(window.innerHeight * EXPANDED_VIEWPORT_RATIO);
  }

  #isAtMaxHeight(): boolean {
    return this.sheetElement().getBoundingClientRect().height >= this.#expandedHeight() - 1;
  }

  #engage(event: PointerEvent): void {
    const sheet = this.sheetElement();

    this.#engaged = true;
    this.#startY = event.clientY;
    this.#startHeight = sheet.getBoundingClientRect().height;
    this.#maxExpandedPx = this.#expandedHeight();
    this.#pendingTranslate = 0;
    this.#pendingHeight = this.#startHeight;
    this.#grew = false;

    this.renderer.setStyle(sheet, 'transition', 'none');
    this.renderer.setStyle(sheet, 'userSelect', 'none');
    this.#armClickGuard();
  }

  #armClickGuard(): void {
    this.sheetElement().addEventListener('click', this.#swallowClick, {
      capture: true,
      once: true,
    });
  }

  #disarmClickGuard(): void {
    this.sheetElement().removeEventListener('click', this.#swallowClick, { capture: true });
  }

  #trackVelocity(event: PointerEvent): void {
    const elapsed = event.timeStamp - this.#lastTimeStamp;
    if (elapsed <= 0) {
      return;
    }

    this.#velocity = (event.clientY - this.#lastY) / elapsed;
    this.#lastY = event.clientY;
    this.#lastTimeStamp = event.timeStamp;
  }

  #onPointerMove(event: PointerEvent): void {
    this.#trackVelocity(event);

    if (!this.#engaged) {
      const travel = event.clientY - this.#startY;
      if (Math.abs(travel) < ENGAGE_TRAVEL_THRESHOLD_PX) {
        return;
      }
      if (!this.#canTakeOverGesture(travel)) {
        this.#releaseGesture();
        return;
      }
      this.#engage(event);
      return;
    }

    this.#applyDrag(event);
  }

  #applyDrag(event: PointerEvent): void {
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

  #onPointerUp(): void {
    const wasEngaged = this.#engaged;
    this.#releaseGesture();

    if (!wasEngaged) {
      return;
    }

    if (this.#shouldDismiss()) {
      this.#animateDismiss();
      return;
    }

    if (this.#shouldExpand()) {
      this.#snapExpanded();
      return;
    }

    this.#settleBack();
  }

  #shouldDismiss(): boolean {
    if (this.#pendingTranslate > CLOSE_TRAVEL_THRESHOLD_PX) {
      return true;
    }
    return (
      this.#velocity > FLICK_VELOCITY_PX_PER_MS && this.#pendingTranslate > FLICK_MIN_TRAVEL_PX
    );
  }

  #shouldExpand(): boolean {
    if (!this.#grew) {
      return false;
    }

    const gained = this.#pendingHeight - this.#startHeight;
    if (gained > EXPAND_TRAVEL_THRESHOLD_PX) {
      return true;
    }
    return this.#velocity < -FLICK_VELOCITY_PX_PER_MS && gained > FLICK_MIN_TRAVEL_PX;
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

    this.#afterTransition(sheet, () => {
      this.#resetStyles(sheet);
      this.dismissed.emit();
    });
  }

  #afterTransition(sheet: HTMLElement, done: () => void): void {
    const running = sheet.getAnimations();

    if (!running.length) {
      done();
      return;
    }

    Promise.all(running.map(animation => animation.finished))
      .then(done)
      .catch(() => done());
  }

  #clearTransitionAfterEnd(sheet: HTMLElement): void {
    this.#afterTransition(sheet, () => this.renderer.removeStyle(sheet, 'transition'));
  }

  #revertToNaturalAfterEnd(sheet: HTMLElement): void {
    this.#afterTransition(sheet, () => {
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

  #releaseGesture(): void {
    if (this.#engaged) {
      this.renderer.removeStyle(this.sheetElement(), 'userSelect');
    }
    this.#engaged = false;
    this.#moveUnlisten?.();
    this.#upUnlisten?.();
    this.#cancelUnlisten?.();
    this.#moveUnlisten = null;
    this.#upUnlisten = null;
    this.#cancelUnlisten = null;
  }
}
