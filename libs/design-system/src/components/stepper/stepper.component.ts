import {
  CdkStep,
  CdkStepHeader,
  CdkStepLabel,
  CdkStepper,
  CdkStepperNext,
  CdkStepperPrevious,
  STEP_STATE,
  type StepperOrientation,
} from '@angular/cdk/stepper';
import { NgTemplateOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  contentChildren,
  ContentChildren,
  Directive,
  inject,
  input,
  output,
  type QueryList,
  signal,
  type TemplateRef,
  ViewChildren,
  ViewEncapsulation,
} from '@angular/core';

import { type IconName, NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorCheck,
  phosphorWarning,
} from '@ng-icons/phosphor-icons/regular';
import type { ClassValue } from 'clsx';

import { ViewportService } from '../../core/services/viewport.service';
import { mergeClasses } from '../../utils/merge-classes';
import { ButtonComponent } from '../button';
import { ProgressComponent } from '../progress';

import {
  stepperConnectorVariants,
  stepperContentVariants,
  stepperDotVariants,
  stepperFooterVariants,
  stepperHeaderVariants,
  stepperIndicatorVariants,
  stepperLabelVariants,
  stepperStepHeaderVariants,
  stepperVariants,
  type StepperHeaderVariants,
  type StepperSizeVariants,
  type StepperStateVariants,
} from './stepper.variants';

const STEPPER_HEADER_AUTO = 'auto';

const ASSIGNED_BY_ANGULAR_QUERY = undefined as never;

export type StepperHeaderOption =
  | StepperHeaderVariants
  | typeof STEPPER_HEADER_AUTO;

const STEPPER_LABELS = {
  previous: 'Précédent',
  next: 'Suivant',
  finish: 'Terminer',
  optional: 'Optionnel',
} as const;

function stepCounterLabel(current: number, total: number): string {
  return `Étape ${current} sur ${total}`;
}

type StepView = {
  readonly step: StepComponent;
  readonly number: number;
  readonly label: string;
  readonly description: string;
  readonly errorMessage: string;
  readonly icon: IconName | undefined;
  readonly labelTemplate: TemplateRef<unknown> | undefined;
  readonly optional: boolean;
  readonly state: StepperStateVariants;
  readonly selected: boolean;
  readonly navigable: boolean;
  readonly labelId: string;
  readonly contentId: string;
  readonly headerClass: string;
  readonly indicatorClass: string;
  readonly dotClass: string;
  readonly labelClass: string;
  readonly connectorClass: string;
};

@Directive({
  selector: '[appStepLabel]',
  providers: [{ provide: CdkStepLabel, useExisting: StepLabelDirective }],
})
export class StepLabelDirective extends CdkStepLabel {}

@Directive({ selector: '[appStepperActions]' })
export class StepperActionsDirective {}

@Component({
  selector: 'app-step',
  template: `
    <ng-template>
      <ng-content />
    </ng-template>
  `,
  providers: [{ provide: CdkStep, useExisting: StepComponent }],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'appStep',
})
export class StepComponent extends CdkStep {
  readonly description = input('');
  readonly icon = input<IconName>();
}

@Component({
  selector: 'app-stepper',
  imports: [
    NgTemplateOutlet,
    NgIcon,
    ButtonComponent,
    ProgressComponent,
    CdkStepHeader,
    CdkStepperNext,
    CdkStepperPrevious,
  ],
  template: `
    @let views = stepViews();
    @let kind = resolvedHeader();

    @if (kind === 'progress') {
      <div data-slot="stepper-header" [class]="headerClasses()">
        <div class="flex items-baseline justify-between gap-3">
          <p class="truncate text-sm font-medium">{{ activeLabel() }}</p>
          <p class="text-muted-foreground shrink-0 text-xs tabular-nums">
            {{ counterLabel() }}
          </p>
        </div>
        <app-progress class="h-1.5" [value]="progressValue()" />
        @if (activeDescription()) {
          <p class="text-muted-foreground text-xs">{{ activeDescription() }}</p>
        }
      </div>
    } @else {
      <div
        role="tablist"
        data-slot="stepper-header"
        [class]="headerClasses()"
        [attr.aria-orientation]="ariaOrientation()"
        (keydown)="handleKeydown($event)"
      >
        @for (view of views; track view.step; let last = $last) {
          <button
            type="button"
            cdkStepHeader
            data-slot="stepper-step-header"
            [class]="view.headerClass"
            [attr.id]="view.labelId"
            [attr.aria-controls]="view.contentId"
            [attr.aria-selected]="view.selected"
            [attr.aria-disabled]="view.navigable ? null : true"
            [attr.tabindex]="view.selected ? 0 : -1"
            [attr.data-state]="view.state"
            (click)="selectStep(view)"
          >
            @if (kind === 'dots') {
              <span aria-hidden="true" [class]="view.dotClass"></span>
              <span class="sr-only">{{ view.label }}</span>
            } @else {
              <span aria-hidden="true" [class]="view.indicatorClass">
                @if (view.state === 'done') {
                  <ng-icon name="phosphorCheck" />
                } @else if (view.state === 'error') {
                  <ng-icon name="phosphorWarning" />
                } @else if (view.icon) {
                  <ng-icon [name]="view.icon" />
                } @else {
                  {{ view.number }}
                }
              </span>
              <span [class]="view.labelClass">
                @if (view.labelTemplate) {
                  <ng-container [ngTemplateOutlet]="view.labelTemplate" />
                } @else {
                  <span class="truncate">{{ view.label }}</span>
                  @if (view.state === 'error' && view.errorMessage) {
                    <span class="text-destructive truncate text-xs font-normal">
                      {{ view.errorMessage }}
                    </span>
                  } @else if (view.description) {
                    <span
                      class="text-muted-foreground truncate text-xs font-normal"
                    >
                      {{ view.description }}
                    </span>
                  } @else if (view.optional) {
                    <span
                      class="text-muted-foreground truncate text-xs font-normal"
                    >
                      {{ optionalLabel() }}
                    </span>
                  }
                }
              </span>
            }
          </button>

          @if (!last && kind === 'numbered') {
            <span aria-hidden="true" [class]="view.connectorClass"></span>
          }
        }
      </div>
    }

    <div class="flex min-w-0 flex-1 flex-col gap-6">
      <div data-slot="stepper-content" [class]="contentClasses()">
        @for (view of views; track view.step) {
          <div
            role="tabpanel"
            [attr.id]="view.contentId"
            [attr.aria-labelledby]="kind === 'progress' ? null : view.labelId"
            [attr.aria-label]="kind === 'progress' ? view.label : null"
            [hidden]="!view.selected"
          >
            <ng-container [ngTemplateOutlet]="view.step.content" />
          </div>
        }
      </div>

      @if (navigation() || hasActions()) {
        <div data-slot="stepper-footer" [class]="footerClasses()">
          <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
            <ng-content select="[appStepperActions]" />
          </div>

          @if (navigation()) {
            <div
              class="flex flex-col-reverse gap-2 sm:flex-row sm:items-center"
            >
              <button
                appButton
                cdkStepperPrevious
                type="button"
                variant="outline"
                class="w-full sm:w-auto"
                [buttonDisabled]="isFirst()"
              >
                {{ previousLabel() }}
              </button>

              @if (isLast()) {
                <button
                  appButton
                  type="button"
                  class="w-full sm:w-auto"
                  [buttonDisabled]="!canLeaveCurrent()"
                  (click)="finish.emit()"
                >
                  {{ finishLabel() }}
                </button>
              } @else {
                <button
                  appButton
                  cdkStepperNext
                  type="button"
                  class="w-full sm:w-auto"
                  [buttonDisabled]="!canLeaveCurrent()"
                >
                  {{ nextLabel() }}
                </button>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  providers: [{ provide: CdkStepper, useExisting: StepperComponent }],
  viewProviders: [provideIcons({ phosphorCheck, phosphorWarning })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'appStepper',
  host: {
    'data-slot': 'stepper',
    '[class]': 'classes()',
  },
})
export class StepperComponent extends CdkStepper {
  @ContentChildren(StepComponent, { descendants: true })
  override _steps: QueryList<StepComponent> = ASSIGNED_BY_ANGULAR_QUERY;

  @ViewChildren(CdkStepHeader)
  override _stepHeader: QueryList<CdkStepHeader> = ASSIGNED_BY_ANGULAR_QUERY;

  readonly header = input<StepperHeaderOption>(STEPPER_HEADER_AUTO);
  readonly size = input<StepperSizeVariants>('default');
  readonly navigation = input(true, { transform: booleanAttribute });
  readonly previousLabel = input(STEPPER_LABELS.previous);
  readonly nextLabel = input(STEPPER_LABELS.next);
  readonly finishLabel = input(STEPPER_LABELS.finish);
  readonly optionalLabel = input(STEPPER_LABELS.optional);
  readonly class = input<ClassValue>('');
  readonly headerClass = input<ClassValue>('');

  readonly finish = output<void>();

  private readonly stepItems = contentChildren(StepComponent, {
    descendants: true,
  });
  private readonly actions = contentChild(StepperActionsDirective);

  readonly #viewport = inject(ViewportService);
  readonly #orientation = signal<StepperOrientation>('horizontal');
  readonly #stateRevision = signal(0);

  override get orientation(): StepperOrientation {
    return this.#orientation();
  }

  override set orientation(value: StepperOrientation) {
    super.orientation = value;
    this.#orientation.set(value);
  }

  override _stateChanged(): void {
    super._stateChanged();
    this.#stateRevision.update((revision) => revision + 1);
  }

  protected readonly hasActions = computed(() => !!this.actions());

  protected readonly resolvedHeader = computed<StepperHeaderVariants>(() => {
    const requested = this.header();
    if (requested !== STEPPER_HEADER_AUTO) {
      return requested;
    }
    return this.#viewport.isMobile() ? 'progress' : 'numbered';
  });

  protected readonly ariaOrientation = computed(() =>
    this.resolvedHeader() === 'dots' ? 'horizontal' : this.#orientation(),
  );

  protected readonly stepViews = computed<readonly StepView[]>(() => {
    this.#stateRevision();
    const orientation = this.#orientation();
    const size = this.size();

    return this.stepItems().map((step, index) => {
      const selected = step.isSelected();
      const state = this.#stateOf(step, selected);
      return {
        step,
        number: index + 1,
        label: step.label,
        description: step.description(),
        errorMessage: step.errorMessage,
        icon: step.icon(),
        labelTemplate: step.stepLabel?.template,
        optional: step.optional,
        state,
        selected,
        navigable: step.isNavigable(),
        labelId: this._getStepLabelId(index),
        contentId: this._getStepContentId(index),
        headerClass: stepperStepHeaderVariants({
          size,
          navigable: step.isNavigable(),
        }),
        indicatorClass: stepperIndicatorVariants({ size, state }),
        dotClass: stepperDotVariants({ state }),
        labelClass: stepperLabelVariants({ size, state }),
        connectorClass: stepperConnectorVariants({
          orientation,
          size,
          done: state === 'done',
        }),
      } satisfies StepView;
    });
  });

  protected readonly activeIndex = computed(() =>
    Math.max(
      this.stepViews().findIndex((view) => view.selected),
      0,
    ),
  );

  protected readonly activeView = computed(
    () => this.stepViews()[this.activeIndex()],
  );
  protected readonly activeLabel = computed(
    () => this.activeView()?.label ?? '',
  );
  protected readonly activeDescription = computed(
    () => this.activeView()?.description ?? '',
  );

  protected readonly counterLabel = computed(() =>
    stepCounterLabel(
      this.activeIndex() + 1,
      Math.max(this.stepViews().length, 1),
    ),
  );

  protected readonly progressValue = computed(() => {
    const total = this.stepViews().length;
    if (total === 0) {
      return 0;
    }
    return ((this.activeIndex() + 1) / total) * 100;
  });

  protected readonly isFirst = computed(() => this.activeIndex() === 0);
  protected readonly isLast = computed(
    () => this.activeIndex() === Math.max(this.stepViews().length - 1, 0),
  );

  protected readonly canLeaveCurrent = computed(() => {
    if (!this.linear) {
      return true;
    }
    const current = this.activeView();
    if (!current) {
      return true;
    }
    return current.optional || current.step.completed;
  });

  protected readonly classes = computed(() =>
    mergeClasses(
      stepperVariants({ orientation: this.#orientation() }),
      this.class(),
    ),
  );

  protected readonly headerClasses = computed(() =>
    mergeClasses(
      stepperHeaderVariants({
        orientation: this.#orientation(),
        header: this.resolvedHeader(),
      }),
      this.headerClass(),
    ),
  );

  protected readonly contentClasses = computed(() => stepperContentVariants());
  protected readonly footerClasses = computed(() => stepperFooterVariants());

  protected selectStep(view: StepView): void {
    if (!view.navigable) {
      return;
    }
    view.step.select();
  }

  protected handleKeydown(event: KeyboardEvent): void {
    this._onKeydown(event);
  }

  #stateOf(step: StepComponent, selected: boolean): StepperStateVariants {
    if (step.indicatorType() === STEP_STATE.ERROR) {
      return 'error';
    }
    if (selected) {
      return 'active';
    }
    return step.completed ? 'done' : 'todo';
  }
}
