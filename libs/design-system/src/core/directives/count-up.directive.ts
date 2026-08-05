import {
  afterNextRender,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  signal,
} from '@angular/core';

const DEFAULT_DURATION_MS = 1000;
const COUNT_START_VALUE = 0;
const NO_FRAME_SCHEDULED = null;
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const DECIMALS_PATTERN = /\.(\d+)/;

function easeOutQuad(progress: number): number {
  return 1 - (1 - progress) * (1 - progress);
}

type CountTarget = { value: number; decimals: number };

@Directive({
  selector: '[appCountUp]',
  exportAs: 'appCountUp',
})
export class CountUpDirective {
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly #destroyRef = inject(DestroyRef);

  readonly duration = input(DEFAULT_DURATION_MS);

  readonly #target = signal<CountTarget | null>(null);
  #frameId: number | null = NO_FRAME_SCHEDULED;

  #lastRendered: string | null = null;
  #observer: MutationObserver | null = null;

  constructor() {
    afterNextRender(() => {
      this.#captureTargetFromHost();
      this.#observeHostValue();
    });

    effect(() => {
      const target = this.#target();
      const duration = this.duration();
      if (!target) {
        return;
      }
      this.#animateTo(target, duration);
    });

    this.#destroyRef.onDestroy(() => {
      this.#cancelFrame();
      this.#observer?.disconnect();
    });
  }

  #observeHostValue(): void {
    if (typeof MutationObserver === 'undefined') {
      return;
    }
    this.#observer = new MutationObserver(() => this.#onHostValueChanged());
    this.#observer.observe(this.#host.nativeElement, {
      childList: true,
      characterData: true,
      subtree: true,
    });
  }

  #onHostValueChanged(): void {
    if (this.#currentText() === this.#lastRendered) {
      return;
    }
    this.#captureTargetFromHost();
  }

  #captureTargetFromHost(): void {
    const rawText = this.#currentText();
    const value = Number(rawText.trim());
    if (rawText.trim() === '' || Number.isNaN(value)) {
      return;
    }
    this.#target.set({ value, decimals: this.#countDecimals(rawText) });
  }

  #currentText(): string {
    return this.#host.nativeElement.textContent ?? '';
  }

  #countDecimals(rawText: string): number {
    const match = rawText.trim().match(DECIMALS_PATTERN);
    return match ? match[1].length : 0;
  }

  #animateTo(target: CountTarget, duration: number): void {
    this.#cancelFrame();

    if (duration <= 0 || this.#prefersReducedMotion()) {
      this.#render(target.value, target.decimals);
      return;
    }

    let startTimestamp: number | null = null;
    const step = (timestamp: number): void => {
      startTimestamp ??= timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const eased = easeOutQuad(progress);
      const current = COUNT_START_VALUE + (target.value - COUNT_START_VALUE) * eased;
      this.#render(current, target.decimals);
      if (progress < 1) {
        this.#frameId = requestAnimationFrame(step);
        return;
      }
      this.#frameId = NO_FRAME_SCHEDULED;
    };

    this.#render(COUNT_START_VALUE, target.decimals);
    this.#frameId = requestAnimationFrame(step);
  }

  #render(value: number, decimals: number): void {
    const text = value.toFixed(decimals);
    this.#lastRendered = text;
    this.#writeText(text);
  }

  #writeText(text: string): void {
    const host = this.#host.nativeElement;
    const node = host.firstChild;
    if (node && node.nodeType === Node.TEXT_NODE) {
      node.nodeValue = text;
      return;
    }
    host.textContent = text;
  }

  #prefersReducedMotion(): boolean {
    return window.matchMedia(REDUCED_MOTION_QUERY).matches;
  }

  #cancelFrame(): void {
    if (this.#frameId === NO_FRAME_SCHEDULED) {
      return;
    }
    cancelAnimationFrame(this.#frameId);
    this.#frameId = NO_FRAME_SCHEDULED;
  }
}
