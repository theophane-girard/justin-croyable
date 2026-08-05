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
 */
export const MOBILE_SHEET_CONTENT_CLASSES =
  'fixed inset-x-0 bottom-0 z-50 max-h-[85vh] w-auto max-w-none overflow-y-auto rounded-t-xl rounded-b-none border-x-0 border-b-0 animate-in slide-in-from-bottom duration-300';

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
