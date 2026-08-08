import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';

import {
  booleanFilter,
  ButtonComponent,
  CardComponent,
  enumFilter,
  InputDirective,
  injectQueryFilters,
  SelectImports,
  type SortDirection,
  sortFilter,
  stringFilter,
  SwitchComponent,
} from '@justin-croyable/design-system';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorArrowDown,
  phosphorArrowsClockwise,
  phosphorArrowUp,
} from '@ng-icons/phosphor-icons/regular';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';

const CULTURE = {
  all: 'all',
  tomate: 'tomate',
  courgette: 'courgette',
  fraise: 'fraise',
} as const;

type Culture = (typeof CULTURE)[keyof typeof CULTURE];

const CULTURE_OPTIONS: readonly { readonly value: Culture; readonly label: string }[] = [
  { value: CULTURE.all, label: 'Toutes les cultures' },
  { value: CULTURE.tomate, label: 'Tomate' },
  { value: CULTURE.courgette, label: 'Courgette' },
  { value: CULTURE.fraise, label: 'Fraise' },
];

const SORT_FIELDS = ['nom', 'recolte'] as const;
type SortField = (typeof SORT_FIELDS)[number];

@Component({
  selector: 'app-url-filters-demo',
  imports: [NgIcon, ButtonComponent, CardComponent, InputDirective, SwitchComponent, ...SelectImports],
  template: `
    <div class="flex w-full max-w-3xl flex-col gap-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
        <label class="flex flex-1 flex-col gap-1.5">
          <span class="text-muted-foreground text-sm font-medium">Recherche</span>
          <input
            app-input
            type="text"
            placeholder="Rechercher une culture…"
            [value]="filters.search()"
            (valueChange)="onSearch($event)"
          />
        </label>

        <label class="flex flex-col gap-1.5">
          <span class="text-muted-foreground text-sm font-medium">Culture</span>
          <app-select
            class="w-48"
            [value]="filters.culture()"
            (valueChange)="onCulture($event)"
          >
            @for (option of cultureOptions; track option.value) {
              <app-select-item [value]="option.value">{{ option.label }}</app-select-item>
            }
          </app-select>
        </label>

        <app-switch [checked]="filters.inStock()" (checkedChange)="filters.set('inStock', $event)">
          En stock uniquement
        </app-switch>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <span class="text-muted-foreground text-sm font-medium">Trier :</span>
        @for (field of sortFields; track field) {
          <button
            appButton
            variant="outline"
            size="sm"
            [class]="filters.sort()?.field === field ? 'border-primary text-primary' : ''"
            (click)="toggleSort(field)"
          >
            {{ field }}
            @if (filters.sort()?.field === field) {
              <ng-icon
                [name]="filters.sort()?.direction === 'desc' ? 'phosphorArrowDown' : 'phosphorArrowUp'"
                class="size-4"
              />
            }
          </button>
        }
        <button appButton variant="ghost" size="sm" class="ml-auto" (click)="filters.reset()">
          <ng-icon name="phosphorArrowsClockwise" class="size-4" />
          Réinitialiser
        </button>
      </div>

      <app-card>
        <div class="flex flex-col gap-3">
          <div class="flex flex-col gap-1">
            <span class="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Query params de l'URL
            </span>
            <code class="bg-muted text-foreground rounded-md px-2 py-1 font-mono text-sm break-all">
              {{ urlQuery() }}
            </code>
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Filtres décodés (filters.value())
            </span>
            <pre class="bg-muted text-foreground overflow-x-auto rounded-md p-3 font-mono text-sm">{{ filtersJson() }}</pre>
          </div>
        </div>
      </app-card>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class UrlFiltersDemoComponent {
  private readonly route = inject(ActivatedRoute);

  protected readonly cultureOptions = CULTURE_OPTIONS;
  protected readonly sortFields = SORT_FIELDS;

  protected readonly filters = injectQueryFilters({
    search: stringFilter(),
    culture: enumFilter(
      [CULTURE.all, CULTURE.tomate, CULTURE.courgette, CULTURE.fraise],
      CULTURE.all,
    ),
    inStock: booleanFilter(false),
    sort: sortFilter([...SORT_FIELDS], { field: 'nom', direction: 'asc' }),
  });

  protected readonly urlQuery = toSignal(
    this.route.queryParams.pipe(
      map((params) => {
        const query = new URLSearchParams(params as Record<string, string>).toString();
        return query.length === 0 ? '(aucun)' : `?${query}`;
      }),
    ),
    { initialValue: '(aucun)' },
  );

  protected readonly filtersJson = computed(() => JSON.stringify(this.filters.value(), null, 2));

  protected onSearch(value: string | number | null | undefined): void {
    if (typeof value === 'string') {
      this.filters.set('search', value);
    }
  }

  protected onCulture(value: string | string[] | null): void {
    if (this.isCulture(value)) {
      this.filters.set('culture', value);
    }
  }

  protected toggleSort(field: SortField): void {
    const current = this.filters.sort();
    const direction: SortDirection =
      current?.field === field && current.direction === 'asc' ? 'desc' : 'asc';
    this.filters.set('sort', { field, direction });
  }

  private isCulture(value: string | string[] | null): value is Culture {
    return typeof value === 'string' && CULTURE_OPTIONS.some((option) => option.value === value);
  }
}

const meta: Meta<UrlFiltersDemoComponent> = {
  title: 'Utilitaires/Filtres URL',
  component: UrlFiltersDemoComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [provideIcons({ phosphorArrowUp, phosphorArrowDown, phosphorArrowsClockwise })],
    }),
  ],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          "`injectQueryFilters()` synchronise les filtres d'une page avec les query params de l'URL : l'URL est la source de vérité unique (lecture réactive via `toSignal`, écriture via `router.navigate`). Modifiez les contrôles ci-dessous et observez l'encart : les query params de l'URL et l'objet de filtres décodé restent toujours synchronisés. Les valeurs par défaut (`culture=all`, `inStock=false`, tri `nom asc`) ne sont pas écrites dans l'URL.",
      },
    },
  },
  render: () => ({ template: `<app-url-filters-demo />` }),
};

export default meta;
type Story = StoryObj<UrlFiltersDemoComponent>;

export const Default: Story = {};
