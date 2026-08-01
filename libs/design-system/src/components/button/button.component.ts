import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  type OnDestroy,
  ElementRef,
  inject,
  input,
  signal,
  ViewEncapsulation,
  booleanAttribute,
} from '@angular/core';

import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideLoaderCircle } from '@ng-icons/lucide';
import type { ClassValue } from 'clsx';

import { mergeClasses } from '../../utils/merge-classes';

import {
  buttonVariants,
  type ButtonShape,
  type ButtonSize,
  type ButtonVariant,
} from './button.variants';

@Component({
  selector: 'app-button, button[appButton], a[appButton]',
  imports: [NgIcon],
  template: `
    @if (loading()) {
      <ng-icon name="lucideLoaderCircle" class="animate-spin duration-2000" />
    }
    <ng-content />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  viewProviders: [provideIcons({ lucideLoaderCircle })],
  host: {
    '[class]': 'classes()',
    '[attr.data-icon-only]': 'iconOnly() || null',
    '[attr.data-disabled]': 'isNotInsideOfButtonOrLink() && buttonDisabled() || null',
    '[attr.aria-disabled]': 'isNotInsideOfButtonOrLink() && buttonDisabled() || null',
    '[attr.disabled]': 'isNotInsideOfButtonOrLink() && buttonDisabled() ? "" : null',
  },
  exportAs: 'button',
})
export class ButtonComponent implements OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  readonly variant = input<ButtonVariant>('default');
  readonly size = input<ButtonSize>('default');
  readonly shape = input<ButtonShape>('default');
  readonly class = input<ClassValue>('');
  readonly full = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  readonly buttonDisabled = input(false, { transform: booleanAttribute });

  private readonly iconOnlyState = signal(false);
  readonly iconOnly = this.iconOnlyState.asReadonly();

  private _mutationObserver: MutationObserver | null = null;

  constructor() {
    /**
     * Rôle et tabindex sont posés impérativement, et seulement sur un élément
     * qui n'est ni un bouton ni un lien.
     *
     * En liaison d'hôte, ils s'écrivaient dans tous les cas — `null` compris,
     * qui supprime l'attribut — et l'emportaient sur ce qu'écrit l'appelant :
     * sur les onglets, rendus par `<button appButton role="tab"
     * [attr.tabindex]="…">`, le rôle d'onglet devenait `button` et le tabindex
     * roulant était figé à 0. Sur un bouton natif ces deux attributs sont de
     * toute façon redondants.
     */
    if (this.needsButtonSemantics()) {
      const host = this.elementRef.nativeElement;
      host.setAttribute('role', 'button');
      host.setAttribute('tabindex', '0');
    }

    afterNextRender(() => {
      if (typeof window === 'undefined' || typeof MutationObserver === 'undefined') {
        return;
      }

      const check = () => {
        const el = this.elementRef.nativeElement;
        const hasIcon = el.querySelector('ng-icon') !== null;
        const children = Array.from<Node>(el.childNodes);
        const hasText = children.some(node => {
          if (node.nodeType === 3) {
            return node.textContent?.trim() !== '';
          }
          if (node.nodeType === 1) {
            const element = node as HTMLElement;
            if (element.matches('ng-icon')) {
              return false;
            }
            return element.textContent?.trim() !== '';
          }
          return false;
        });

        this.iconOnlyState.set(hasIcon && !hasText);
      };

      check();
      this._mutationObserver = new MutationObserver(check);
      this._mutationObserver.observe(this.elementRef.nativeElement, {
        childList: true,
        characterData: true,
        subtree: true,
      });
    });
  }

  ngOnDestroy(): void {
    if (this._mutationObserver) {
      this._mutationObserver.disconnect();
      this._mutationObserver = null;
    }
  }

  protected readonly classes = computed(() =>
    mergeClasses(
      buttonVariants({
        type: this.variant(),
        size: this.size(),
        shape: this.shape(),
        full: this.full(),
        loading: this.loading(),
        disabled: this.buttonDisabled(),
      }),
      this.class(),
    ),
  );

  /**
   * Le rôle et le tabindex ne sont posés que sur un élément qui n'est pas déjà
   * un bouton ou un lien.
   *
   * Une liaison d'hôte l'emporte sur ce qu'écrit l'appelant, y compris sur un
   * attribut statique : sur `<button appButton role="tab">`, forcer
   * `role="button"` effaçait le rôle d'onglet, et forcer `tabindex="0"` annulait
   * le tabindex roulant de la barre d'onglets. Sur un bouton natif ces deux
   * attributs sont de toute façon redondants.
   */
  protected readonly needsButtonSemantics = computed(() => {
    const { tagName } = this.elementRef.nativeElement;
    return tagName !== 'BUTTON' && tagName !== 'A' && this.isNotInsideOfButtonOrLink();
  });

  protected readonly isNotInsideOfButtonOrLink = computed(() => {
    // Evaluated once; assumes component parent doesn't change after mount
    const zardButtonElement = this.elementRef.nativeElement;
    if (zardButtonElement.parentElement) {
      const { tagName } = zardButtonElement.parentElement;
      return tagName !== 'BUTTON' && tagName !== 'A';
    }
    return true;
  });
}
