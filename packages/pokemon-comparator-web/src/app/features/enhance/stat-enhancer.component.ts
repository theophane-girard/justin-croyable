import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
  type TemplateRef,
  ViewContainerRef,
  viewChild,
} from '@angular/core';

import {
  ButtonComponent,
  SheetService,
  SwitchComponent,
  TabComponent,
  TabGroupComponent,
} from '@justin-croyable/design-system';
import { NgIcon } from '@ng-icons/core';

import { ComparatorStore } from '../../core/comparator-store';
import { type Stat } from '../../core/pokemon.model';
import {
  DEFAULT_ENHANCE_CONFIG,
  DEFAULT_LEVEL,
  type EnhanceConfig,
  evsTotal,
  maxEvForStat,
} from '../../core/pokemon-stats';
import { EnhanceTargetPanelComponent, type EvChange } from './enhance-target-panel.component';

export interface EnhanceTarget {
  readonly id: number;
  readonly name: string;
}

interface TargetDraft {
  readonly level: number;
  readonly nature: string;
  readonly evs: Readonly<Record<Stat, number>>;
}

interface PanelView {
  readonly id: number;
  readonly name: string;
  readonly level: number;
  readonly nature: string;
  readonly evs: Readonly<Record<Stat, number>>;
}

@Component({
  selector: 'app-stat-enhancer',
  imports: [
    NgIcon,
    ButtonComponent,
    SwitchComponent,
    TabGroupComponent,
    TabComponent,
    EnhanceTargetPanelComponent,
  ],
  template: `
    <button appButton type="button" variant="outline" size="default" [full]="full()" (click)="open()">
      <ng-icon name="phosphorMagicWand" class="size-4" />
      Enhance
    </button>

    <ng-template #enhanceSheet>
      <div class="flex flex-col gap-6">
        <p class="text-muted-foreground text-sm">
          À la validation, les statistiques sont calculées au niveau choisi avec des IV parfaits
          (31), selon la nature et les EV définis ci-dessous.
        </p>

        @if (isMulti()) {
          <app-switch [checked]="applyToAll()" (checkedChange)="applyToAll.set($event)">
            Appliquer à tous les Pokémon
          </app-switch>

          <app-tab-group>
            @for (panel of panels(); track panel.id) {
              <app-tab [label]="panel.name">
                <div class="pt-4">
                  <app-enhance-target-panel
                    [nature]="panel.nature"
                    [evs]="panel.evs"
                    [level]="panel.level"
                    (natureChange)="onNature(panel.id, $event)"
                    (evChange)="onEv(panel.id, $event)"
                    (levelChange)="onLevel(panel.id, $event)"
                  />
                </div>
              </app-tab>
            }
          </app-tab-group>
        } @else if (panels().length) {
          @let only = panels()[0];
          <app-enhance-target-panel
            [nature]="only.nature"
            [evs]="only.evs"
            [level]="only.level"
            (natureChange)="onNature(only.id, $event)"
            (evChange)="onEv(only.id, $event)"
            (levelChange)="onLevel(only.id, $event)"
          />
        }

        <div class="flex justify-end">
          <button appButton type="button" variant="ghost" size="sm" (click)="reset()">
            <ng-icon name="phosphorArrowClockwise" class="size-4" />
            Réinitialiser
          </button>
        </div>
      </div>
    </ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatEnhancerComponent {
  readonly full = input<boolean>(false);
  readonly targets = input.required<readonly EnhanceTarget[]>();

  readonly #store = inject(ComparatorStore);
  readonly #sheet = inject(SheetService);
  readonly #viewContainerRef = inject(ViewContainerRef);

  private readonly enhanceTemplate = viewChild.required<TemplateRef<unknown>>('enhanceSheet');

  protected readonly applyToAll = signal<boolean>(true);
  readonly #draft = signal<Record<number, TargetDraft>>({});

  protected readonly isMulti = computed(() => this.targets().length > 1);

  protected readonly panels = computed<readonly PanelView[]>(() => {
    const draft = this.#draft();
    return this.targets().map(target => {
      const entry = draft[target.id];
      return {
        id: target.id,
        name: target.name,
        level: entry ? entry.level : DEFAULT_LEVEL,
        nature: entry ? entry.nature : DEFAULT_ENHANCE_CONFIG.nature,
        evs: entry ? entry.evs : DEFAULT_ENHANCE_CONFIG.evs,
      };
    });
  });

  protected open(): void {
    this.#draft.set(
      this.targets().reduce((draft, target) => {
        const config = this.#store.enhanceFor(target.id);
        draft[target.id] = { level: config.level, nature: config.nature, evs: config.evs };
        return draft;
      }, {} as Record<number, TargetDraft>),
    );
    this.#sheet.create({
      content: this.enhanceTemplate(),
      side: 'bottom',
      title: 'Enhance',
      okText: 'Valider',
      cancelText: 'Annuler',
      maskClosable: true,
      viewContainerRef: this.#viewContainerRef,
      customClasses: 'p-4',
      onOk: () => this.#applyDraft(),
    });
  }

  protected onNature(id: number, nature: string): void {
    this.#updateDraft(id, entry => ({ ...entry, nature }));
  }

  protected onLevel(id: number, level: number): void {
    this.#updateDraft(id, entry => ({ ...entry, level }));
  }

  protected onEv(id: number, change: EvChange): void {
    this.#updateDraft(id, entry => {
      const max = maxEvForStat(entry.evs[change.stat], evsTotal(entry.evs));
      const bounded = Math.max(0, Math.min(change.value, max));
      return { ...entry, evs: { ...entry.evs, [change.stat]: bounded } };
    });
  }

  protected reset(): void {
    const ids = this.targets().map(target => target.id);
    this.#draft.set(
      ids.reduce((draft, id) => {
        draft[id] = {
          level: DEFAULT_LEVEL,
          nature: DEFAULT_ENHANCE_CONFIG.nature,
          evs: DEFAULT_ENHANCE_CONFIG.evs,
        };
        return draft;
      }, {} as Record<number, TargetDraft>),
    );
    this.#store.resetEnhanceConfigs(ids);
    this.#store.setEnhanceAllConfig(null);
  }

  #updateDraft(id: number, updater: (entry: TargetDraft) => TargetDraft): void {
    const ids = this.applyToAll() ? this.targets().map(target => target.id) : [id];
    const draft = { ...this.#draft() };
    ids.forEach(targetId => {
      const entry = draft[targetId] ?? {
        level: DEFAULT_LEVEL,
        nature: DEFAULT_ENHANCE_CONFIG.nature,
        evs: DEFAULT_ENHANCE_CONFIG.evs,
      };
      draft[targetId] = updater(entry);
    });
    this.#draft.set(draft);
  }

  #applyDraft(): void {
    const configs = new Map<number, EnhanceConfig>();
    this.targets().forEach(target => {
      const entry = this.#draft()[target.id] ?? {
        level: DEFAULT_LEVEL,
        nature: DEFAULT_ENHANCE_CONFIG.nature,
        evs: DEFAULT_ENHANCE_CONFIG.evs,
      };
      configs.set(target.id, {
        level100: true,
        level: entry.level,
        nature: entry.nature,
        evs: entry.evs,
      });
    });
    this.#store.setEnhanceConfigs(configs);

    if (!this.isMulti()) {
      return;
    }
    const firstTargetId = this.targets()[0]?.id;
    const sharedConfig = firstTargetId === undefined ? undefined : configs.get(firstTargetId);
    this.#store.setEnhanceAllConfig(this.applyToAll() && sharedConfig ? sharedConfig : null);
  }
}
