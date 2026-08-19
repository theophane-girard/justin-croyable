import { isPlatformBrowser } from '@angular/common';
import { DestroyRef, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

/**
 * Requête média « mobile » alignée sur le breakpoint `sm` de Tailwind (640px) :
 * en dessous, les overlays (select, combobox…) s'affichent en bottom sheet.
 */
export const MOBILE_MEDIA_QUERY = '(max-width: 639.98px)';

/**
 * Classes appliquées au contenu d'un overlay présenté en bottom sheet sur mobile.
 * Reproduit le positionnement du composant sheet (`fixed inset-x-0 bottom-0`) et
 * l'emporte, via twMerge, sur la largeur/les coins des variantes popover/select.
 *
 * La largeur est marquée `!important` : une classe statique posée par le
 * consommateur (`<app-popover class="max-w-xs">`) reste sur l'élément en plus du
 * binding `[class]`, donc hors de portée de twMerge — sans `!` c'est l'ordre de
 * la feuille Tailwind qui trancherait, et `max-w-xs` gagnerait.
 */
export const MOBILE_SHEET_CONTENT_CLASSES =
  'fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] w-auto! max-w-none! overflow-y-auto overscroll-contain rounded-t-xl rounded-b-none border-x-0 border-b-0';

/** Animation d'entrée du bottom sheet (glisse depuis le bas). */
export const MOBILE_SHEET_ENTER_CLASSES = 'animate-in slide-in-from-bottom duration-300';

/** Animation de sortie du bottom sheet (glisse vers le bas). */
export const MOBILE_SHEET_EXIT_CLASSES = 'animate-out slide-out-to-bottom duration-200';

/**
 * Joue l'animation de fermeture du bottom sheet sur `element`, puis appelle
 * `onDone` (typiquement le détachement de l'overlay) à la fin de l'animation.
 * S'appuie sur `animationend` — qui se déclenche aussi en `prefers-reduced-motion`
 * (durée quasi nulle) — pour ne pas dépendre d'un timer.
 */
export function runMobileSheetCloseAnimation(element: HTMLElement, onDone: () => void): void {
  element.classList.remove(...MOBILE_SHEET_ENTER_CLASSES.split(' '));
  element.classList.add(...MOBILE_SHEET_EXIT_CLASSES.split(' '));

  let finished = false;
  const finish = () => {
    if (finished) {
      return;
    }
    finished = true;
    element.removeEventListener('animationend', finish);
    onDone();
  };
  element.addEventListener('animationend', finish);
}

@Injectable({ providedIn: 'root' })
export class ViewportService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  private readonly mediaQueryList = this.resolveMediaQueryList();
  private readonly _isMobile = signal(this.mediaQueryList?.matches ?? false);

  readonly isMobile = this._isMobile.asReadonly();

  constructor() {
    const mediaQueryList = this.mediaQueryList;
    if (!mediaQueryList) {
      return;
    }
    const listener = (event: MediaQueryListEvent) => this._isMobile.set(event.matches);
    mediaQueryList.addEventListener('change', listener);
    this.destroyRef.onDestroy(() => mediaQueryList.removeEventListener('change', listener));
  }

  private resolveMediaQueryList(): MediaQueryList | null {
    return isPlatformBrowser(this.platformId) ? matchMedia(MOBILE_MEDIA_QUERY) : null;
  }
}
