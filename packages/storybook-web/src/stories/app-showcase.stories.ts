import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  BadgeComponent,
  ButtonComponent,
  CardComponent,
  ChartComponent,
  CheckboxComponent,
  ComboboxComponent,
  DatePickerComponent,
  InputDirective,
  InputGroupComponent,
  LayoutImports,
  RadioGroupImports,
  SelectImports,
  SliderComponent,
  SwitchComponent,
  TableComponent,
  TextareaComponent,
  type ComboboxOption,
  type TabItem,
} from '@justin-croyable/design-system';
import { NgIcon } from '@ng-icons/core';
import type { ColDef } from 'ag-grid-community';
import type { EChartsCoreOption } from 'echarts/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';

const TAB = { dashboard: 'dashboard', form: 'form', list: 'list' } as const;
type TabSlug = (typeof TAB)[keyof typeof TAB];

type NavItem = { slug: TabSlug; label: string; icon: string };

const NAV_ITEMS: NavItem[] = [
  { slug: TAB.dashboard, label: 'Tableau de bord', icon: 'lucideHouse' },
  { slug: TAB.form, label: 'Formulaire', icon: 'lucideFileText' },
  { slug: TAB.list, label: 'Liste', icon: 'lucideInbox' },
];

const HEADER_TABS: TabItem[] = NAV_ITEMS.map(({ slug, label }) => ({ slug, label }));

const mois = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'];

const barresEmpilees: EChartsCoreOption = {
  tooltip: { trigger: 'axis' },
  legend: { data: ['Inscriptions', 'Désabonnements'] },
  xAxis: { type: 'category', data: mois },
  yAxis: { type: 'value' },
  series: [
    { name: 'Inscriptions', type: 'bar', stack: 'total', data: [820, 932, 901, 1290, 1330, 1520] },
    { name: 'Désabonnements', type: 'bar', stack: 'total', data: [120, 210, 190, 134, 200, 230] },
  ],
};

const jauge: EChartsCoreOption = {
  series: [
    {
      type: 'gauge',
      progress: { show: true, width: 10 },
      axisLine: { lineStyle: { width: 10 } },
      detail: { valueAnimation: true, formatter: '{value}%', fontSize: 20 },
      data: [{ value: 72, name: 'Satisfaction' }],
    },
  ],
};

const courbe: EChartsCoreOption = {
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', boundaryGap: false, data: mois },
  yAxis: { type: 'value' },
  series: [
    { name: 'Sessions', type: 'line', smooth: true, areaStyle: {}, data: [220, 332, 301, 434, 390, 530] },
  ],
};

const camembert: EChartsCoreOption = {
  tooltip: { trigger: 'item' },
  legend: { bottom: 0 },
  series: [
    {
      type: 'pie',
      radius: ['45%', '70%'],
      data: [
        { value: 1048, name: 'Angular' },
        { value: 735, name: 'React' },
        { value: 580, name: 'Vue' },
        { value: 300, name: 'Svelte' },
      ],
    },
  ],
};

type Membre = {
  nom: string;
  role: string;
  equipe: string;
  contributions: number;
  actif: boolean;
};

const membres: Membre[] = [
  { nom: 'Théophane Girard', role: 'Propriétaire', equipe: 'Plateforme', contributions: 412, actif: true },
  { nom: 'Maëlle Dupont', role: 'Éditrice', equipe: 'Design', contributions: 287, actif: true },
  { nom: 'Jean Rousseau', role: 'Utilisateur', equipe: 'Support', contributions: 96, actif: false },
  { nom: 'Amina Cherif', role: 'Éditrice', equipe: 'Plateforme', contributions: 341, actif: true },
  { nom: 'Luc Bernard', role: 'Utilisateur', equipe: 'Ventes', contributions: 54, actif: false },
];

const colonnes: ColDef<Membre>[] = [
  { field: 'nom', headerName: 'Nom', minWidth: 200 },
  { field: 'role', headerName: 'Rôle' },
  { field: 'equipe', headerName: 'Équipe' },
  { field: 'contributions', headerName: 'Contributions', type: 'numericColumn' },
  {
    field: 'actif',
    headerName: 'Actif',
    valueFormatter: params => (params.value ? 'Oui' : 'Non'),
  },
];

const paginationOptions = {
  pagination: true,
  paginationPageSize: 10,
  paginationPageSizeSelector: [10, 20, 50],
};

const frameworks: ComboboxOption[] = [
  { value: 'angular', label: 'Angular' },
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue' },
  { value: 'svelte', label: 'Svelte' },
];

type SelectValue = string | string[] | null;

@Component({
  selector: 'app-showcase',
  imports: [
    ...LayoutImports,
    ...SelectImports,
    ...RadioGroupImports,
    NgIcon,
    ButtonComponent,
    BadgeComponent,
    CardComponent,
    ChartComponent,
    TableComponent,
    InputDirective,
    InputGroupComponent,
    TextareaComponent,
    ComboboxComponent,
    CheckboxComponent,
    SwitchComponent,
    SliderComponent,
    DatePickerComponent,
  ],
  template: `
    <div class="h-dvh overflow-hidden">
      <app-layout direction="horizontal" class="h-full">
        <app-sidebar
          [width]="220"
          [collapsible]="true"
          [collapsed]="sidebarCollapsed()"
          (collapsedChange)="sidebarCollapsed.set($event)"
        >
          <app-sidebar-group class="p-3">
            <app-sidebar-group-label [class.hidden]="sidebarCollapsed()">Navigation</app-sidebar-group-label>
            @for (item of navItems; track item.slug) {
              <button
                type="button"
                (click)="select(item.slug)"
                [class]="navItemClass(activeTab() === item.slug)"
                [class.justify-center]="sidebarCollapsed()"
                [attr.title]="sidebarCollapsed() ? item.label : null"
              >
                <ng-icon [name]="item.icon" class="size-4 shrink-0" />
                <span [class.hidden]="sidebarCollapsed()">{{ item.label }}</span>
              </button>
            }
          </app-sidebar-group>
        </app-sidebar>

        <app-layout direction="vertical" class="min-w-0 flex-1">
          <app-header class="px-4" [tabs]="headerTabs" [activeSlug]="activeTab()" (tabClicked)="select($event)">
            <div class="flex items-center gap-2">
              <p class="text-sm font-medium">Espace Justin</p>
              <app-badge type="secondary">Démo</app-badge>
            </div>
            <div class="ml-auto">
              <button appButton size="sm">Nouveau</button>
            </div>
          </app-header>

          <app-content class="min-h-0 p-4">
            @switch (activeTab()) {
              @case (tab.dashboard) {
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div class="border-border rounded-lg border p-4">
                    <h3 class="text-foreground mb-3 text-sm font-medium">Inscriptions & désabonnements (empilé)</h3>
                    <app-chart [options]="barresEmpilees" height="15rem" />
                  </div>
                  <div class="border-border rounded-lg border p-4">
                    <h3 class="text-foreground mb-3 text-sm font-medium">Taux de satisfaction</h3>
                    <app-chart [options]="jauge" height="15rem" />
                  </div>
                  <div class="border-border rounded-lg border p-4">
                    <h3 class="text-foreground mb-3 text-sm font-medium">Sessions (tendance)</h3>
                    <app-chart [options]="courbe" height="15rem" />
                  </div>
                  <div class="border-border rounded-lg border p-4">
                    <h3 class="text-foreground mb-3 text-sm font-medium">Répartition par framework</h3>
                    <app-chart [options]="camembert" height="15rem" />
                  </div>
                </div>
              }

              @case (tab.form) {
                <app-card
                  class="mx-auto w-full max-w-3xl"
                  title="Nouveau membre"
                  description="Un exemple regroupant les champs disponibles du design system."
                >
                  <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <app-input-group label="Nom complet" hint="Prénom et nom." [required]="true">
                      <input app-input type="text" placeholder="Théophane Girard" />
                    </app-input-group>

                    <app-input-group label="Adresse e-mail" hint="Nous ne partagerons jamais votre adresse.">
                      <input app-input type="email" placeholder="jean.dupont@exemple.fr" />
                    </app-input-group>

                    <app-select
                      label="Rôle"
                      placeholder="Sélectionner un rôle…"
                      hint="Détermine les permissions dans l'espace."
                      [required]="true"
                      [value]="role()"
                      (valueChange)="role.set($event)"
                    >
                      <app-select-item value="admin">Administrateur</app-select-item>
                      <app-select-item value="editor">Éditeur</app-select-item>
                      <app-select-item value="user">Utilisateur</app-select-item>
                    </app-select>

                    <app-combobox
                      label="Framework préféré"
                      placeholder="Choisir un framework…"
                      hint="Utilisé pour préparer l'environnement."
                      [options]="frameworks"
                      [value]="framework()"
                      (valueChange)="framework.set($event)"
                    />

                    <div class="flex flex-col gap-2">
                      <label class="text-sm font-medium">Date de début</label>
                      <app-date-picker
                        placeholder="Choisir une date"
                        format="d MMMM yyyy"
                        type="outline"
                        [value]="startDate()"
                        (valueChange)="startDate.set($event)"
                      />
                    </div>

                    <div class="flex flex-col gap-2">
                      <label class="text-sm font-medium">Formule</label>
                      <app-radio-group [value]="plan()" (valueChange)="selectPlan($event)" name="formule">
                        <app-radio value="mensuel">Mensuel</app-radio>
                        <app-radio value="annuel">Annuel — deux mois offerts</app-radio>
                      </app-radio-group>
                    </div>

                    <div class="flex flex-col gap-2 md:col-span-2">
                      <label class="text-sm font-medium">Message</label>
                      <textarea
                        app-textarea
                        rows="4"
                        placeholder="Décrivez le membre…"
                        [value]="message()"
                        (valueChange)="message.set($event)"
                      ></textarea>
                    </div>

                    <div class="flex flex-col gap-2 md:col-span-2">
                      <div class="flex items-center justify-between">
                        <label class="text-sm font-medium">Budget mensuel</label>
                        <span class="text-muted-foreground text-sm">{{ budget()[0] }} €</span>
                      </div>
                      <app-slider
                        [min]="0"
                        [max]="5000"
                        [step]="100"
                        [default]="budget()"
                        (slideIndexChange)="budget.set($event)"
                      />
                    </div>

                    <div class="flex items-center gap-3">
                      <app-switch id="notifications" [checked]="notifications()" (checkedChange)="notifications.set($event)" />
                      <label for="notifications" class="cursor-pointer text-sm">Notifications par e-mail</label>
                    </div>

                    <div class="flex items-center">
                      <app-checkbox (checkChange)="newsletter.set($event)">
                        S'abonner à la newsletter
                      </app-checkbox>
                    </div>
                  </div>

                  <div card-footer class="w-full flex-row justify-end gap-2">
                    <button appButton variant="ghost">Annuler</button>
                    <button appButton>Enregistrer</button>
                  </div>
                </app-card>
              }

              @case (tab.list) {
                <div class="flex flex-col gap-3">
                  <div class="flex items-center justify-between">
                    <h3 class="text-foreground text-sm font-medium">Membres de l'espace</h3>
                    <button appButton size="sm" variant="outline">Exporter</button>
                  </div>
                  <app-table
                    [rowData]="membres"
                    [columnDefs]="colonnes"
                    [gridOptions]="paginationOptions"
                    height="28rem"
                  />
                </div>
              }
            }
          </app-content>

          <app-footer class="text-muted-foreground flex items-center px-4 text-xs">
            Dernière synchronisation il y a 2 minutes
          </app-footer>
        </app-layout>
      </app-layout>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class AppShowcaseComponent {
  protected readonly tab = TAB;
  protected readonly navItems = NAV_ITEMS;
  protected readonly headerTabs = HEADER_TABS;
  protected readonly frameworks = frameworks;
  protected readonly membres = membres;
  protected readonly colonnes = colonnes;
  protected readonly paginationOptions = paginationOptions;
  protected readonly barresEmpilees = barresEmpilees;
  protected readonly jauge = jauge;
  protected readonly courbe = courbe;
  protected readonly camembert = camembert;

  protected readonly activeTab = signal<TabSlug>(TAB.dashboard);
  protected readonly sidebarCollapsed = signal<boolean>(false);

  protected readonly role = signal<SelectValue>('user');
  protected readonly framework = signal<string | null>('angular');
  protected readonly startDate = signal<Date | null>(null);
  protected readonly plan = signal<string>('mensuel');
  protected readonly message = signal<string>('');
  protected readonly budget = signal<number[]>([1200]);
  protected readonly notifications = signal<boolean>(true);
  protected readonly newsletter = signal<boolean>(false);

  protected select(slug: string): void {
    const item = NAV_ITEMS.find(navItem => navItem.slug === slug);
    if (!item) {
      return;
    }
    this.activeTab.set(item.slug);
  }

  protected selectPlan(value: unknown): void {
    if (typeof value !== 'string') {
      return;
    }
    this.plan.set(value);
  }

  protected navItemClass(active: boolean): string {
    const base = 'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors';
    if (active) {
      return `${base} bg-muted text-foreground font-medium`;
    }
    return `${base} text-muted-foreground hover:bg-muted hover:text-foreground`;
  }
}

const meta: Meta<AppShowcaseComponent> = {
  title: 'Exemples/App Showcase',
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [AppShowcaseComponent] })],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          "Exemple d'assemblage grandeur nature : une coquille applicative (`app-layout` + `app-sidebar` + `app-header` à onglets) dont la navigation pilote un signal partagé entre la barre latérale et les onglets de l'en-tête. Chaque onglet illustre un usage réel du design system — le tableau de bord reprend le visuel de la story « Dashboard », le formulaire regroupe tous les champs disponibles, et la liste s'appuie sur le tableau.",
      },
    },
  },
  render: () => ({ template: `<app-showcase />` }),
};

export default meta;
type Story = StoryObj<AppShowcaseComponent>;

export const Default: Story = {};
