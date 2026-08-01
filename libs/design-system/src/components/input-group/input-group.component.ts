import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  effect,
  input,
  signal,
  type TemplateRef,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import type { Field } from '@angular/forms/signals';

import type { ClassValue } from 'clsx';

import { IdDirective } from '../../core';
import {
  isTemplateRef,
  StringTemplateOutletDirective,
} from '../../core/directives/string-template-outlet/string-template-outlet.directive';
import { mergeClasses } from '../../utils/merge-classes';

import {
  inputGroupAddonVariants,
  inputGroupInputVariants,
  inputGroupVariants,
  type InputGroupAddonAlignVariants,
  type InputGroupAddonPositionVariants,
} from './input-group.variants';
import { InputDirective } from '../input/input.directive';
import type { InputSizeVariants } from '../input/input.variants';
import { LoaderComponent } from '../loader/loader.component';

/** Fallback messages, keyed by the validator `kind`, used when an error carries no `message`. */
const DEFAULT_ERROR_MESSAGES: Record<string, string> = {
  required: 'Ce champ est requis.',
  email: 'Adresse e-mail invalide.',
  min: 'Valeur trop petite.',
  max: 'Valeur trop grande.',
  minLength: 'Valeur trop courte.',
  maxLength: 'Valeur trop longue.',
  pattern: 'Format invalide.',
};

@Component({
  selector: 'app-input-group',
  imports: [StringTemplateOutletDirective, LoaderComponent, IdDirective],
  template: `
    @if (label()) {
      <label [id]="labelId()" [attr.for]="controlId()" [class]="labelClasses()">
        {{ label() }}
        @if (required()) {
          <span class="text-destructive" aria-hidden="true">*</span>
        }
      </label>
    }

    <ng-container appId="input-group" #z="appId">
      <div
        [class]="groupClasses()"
        role="group"
        [attr.aria-labelledby]="label() ? labelId() : null"
        [attr.aria-disabled]="disabled() || loading()"
        [attr.data-disabled]="disabled() || loading()"
        [attr.aria-busy]="loading()"
        data-slot="input-group"
      >
        @let addonBeforeContent = addonBefore();
        @if (addonBeforeContent) {
          <div
            [class]="addonBeforeClasses()"
            [id]="addonBeforeId()"
            [attr.aria-disabled]="disabled() || loading()"
          >
            <ng-container *appStringTemplateOutlet="addonBeforeContent">{{
              addonBeforeContent
            }}</ng-container>
          </div>
        }

        <div [class]="inputWrapperClasses()">
          <ng-content select="input[app-input], textarea[app-input]" />

          @if (loading()) {
            <app-loader size="sm" />
          }
        </div>

        @let addonAfterContent = addonAfter();
        @if (addonAfterContent) {
          <div
            [class]="addonAfterClasses()"
            [id]="addonAfterId()"
            [attr.aria-disabled]="disabled() || loading()"
          >
            <ng-container *appStringTemplateOutlet="addonAfterContent">{{
              addonAfterContent
            }}</ng-container>
          </div>
        }
      </div>
    </ng-container>

    @let message = errorMessage();
    @if (message) {
      <p [id]="messageId()" [class]="messageClasses(true)" role="alert" aria-live="polite">
        {{ message }}
      </p>
    } @else if (hint()) {
      <p [id]="messageId()" [class]="messageClasses(false)">{{ hint() }}</p>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'wrapperClasses()',
    'data-slot': 'input-group-field',
  },
})
export class InputGroupComponent {
  readonly class = input<ClassValue>('');
  readonly addonAfter = input<string | TemplateRef<void>>('');
  readonly addonAlign = input<InputGroupAddonAlignVariants>('inline');
  readonly addonBefore = input<string | TemplateRef<void>>('');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  readonly size = input<InputSizeVariants>('default');

  readonly label = input<string>('');
  readonly hint = input<string>('');
  readonly required = input(false, { transform: booleanAttribute });
  /** Signal Forms field to observe for validation state (bind the same field to the inner control). */
  readonly field = input<Field<unknown>>();

  private readonly contentInput = contentChild<InputDirective>(InputDirective);
  private readonly uniqueId = viewChild<IdDirective>('z');
  private readonly controlIdState = signal<string | undefined>(undefined);

  protected readonly baseId = computed(() => this.uniqueId()?.id() ?? 'input-group');
  protected readonly labelId = computed(() => `${this.baseId()}-label`);
  protected readonly messageId = computed(() => `${this.baseId()}-message`);
  protected readonly controlId = computed(() => this.controlIdState());
  protected readonly addonBeforeId = computed(() => `${this.baseId()}-addon-before`);
  protected readonly addonAfterId = computed(() => `${this.baseId()}-addon-after`);

  private readonly fieldState = computed(() => this.field()?.());
  /** Show the error only once the field is invalid and the user has interacted with it. */
  protected readonly showError = computed(() => {
    const state = this.fieldState();
    return !!state && state.invalid() && state.touched();
  });
  protected readonly errorMessage = computed(() => {
    if (!this.showError()) {
      return '';
    }
    const [firstError] = this.fieldState()!.errors();
    if (!firstError) {
      return '';
    }
    return firstError.message ?? DEFAULT_ERROR_MESSAGES[firstError.kind] ?? 'Valeur invalide.';
  });

  protected readonly isAddonBeforeTemplate = computed(() => isTemplateRef(this.addonBefore()));

  protected readonly wrapperClasses = computed(() =>
    mergeClasses('flex w-full flex-col gap-1.5', this.class()),
  );

  protected readonly groupClasses = computed(() => {
    const isTextarea = this.contentInput()?.getType() === 'textarea';
    return mergeClasses(
      'w-full',
      inputGroupVariants({
        size: this.size(),
        disabled: this.disabled() || this.loading(),
      }),
      !isTextarea && !this.addonBefore() ? 'pl-2.5' : '',
      !isTextarea && !this.addonAfter() ? 'pr-2.5' : '',
      this.showError()
        ? 'border-destructive has-[[data-slot=input-group-control]:focus-visible]:border-destructive has-[[data-slot=input-group-control]:focus-visible]:ring-destructive/30'
        : '',
    );
  });

  protected readonly inputWrapperClasses = computed(() =>
    mergeClasses(
      inputGroupInputVariants({
        size: this.size(),
        hasAddonBefore: Boolean(this.addonBefore()),
        hasAddonAfter: Boolean(this.addonAfter()),
        disabled: this.disabled() || this.loading(),
      }),
      'relative',
    ),
  );

  protected readonly addonAfterClasses = computed(() => this.addonClasses('after'));
  protected readonly addonBeforeClasses = computed(() =>
    mergeClasses(this.addonClasses('before'), this.isAddonBeforeTemplate() ? 'pr-0.5' : ''),
  );

  protected labelClasses(): string {
    return 'flex w-fit items-center gap-1 text-sm leading-none font-medium select-none';
  }

  protected messageClasses(isError: boolean): string {
    return mergeClasses('text-sm', isError ? 'text-destructive' : 'text-muted-foreground');
  }

  constructor() {
    effect(() => {
      const contentInput = this.contentInput();
      const disabled = this.disabled();
      const size = this.size();

      if (!contentInput) {
        return;
      }

      if (size) {
        contentInput.size.set(size);
      }
      contentInput.disable(disabled);
      contentInput.setDataSlot('input-group-control');

      // Wire accessibility between the rendered label/message and the projected control.
      this.controlIdState.set(contentInput.ensureId(`${this.baseId()}-control`));
      const hasMessage = Boolean(this.errorMessage()) || Boolean(this.hint());
      contentInput.setAriaDescribedBy(hasMessage ? this.messageId() : null);
      contentInput.setAriaInvalid(this.showError());
      // L'astérisque du libellé n'est que visuel : sans cet attribut, un lecteur
      // d'écran n'annonce pas le champ comme requis. `select` et `combobox`, qui
      // reprennent ce motif, le posaient déjà.
      contentInput.setAriaRequired(this.required());
    });
  }

  private addonClasses(position: InputGroupAddonPositionVariants): string {
    return mergeClasses(
      inputGroupAddonVariants({
        align: this.addonAlign(),
        disabled: this.disabled() || this.loading(),
        position: position,
        size: this.size(),
        type: this.contentInput()?.getType() ?? 'default',
      }),
    );
  }
}
