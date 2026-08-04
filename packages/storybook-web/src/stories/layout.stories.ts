import { ButtonComponent, LayoutImports, type TabItem } from '@justin-croyable/design-system';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';

type LayoutArgs = {
  direction: 'auto' | 'horizontal' | 'vertical';
  collapsible: boolean;
  collapsed: boolean;
  sidebarWidth: number;
  tabs: TabItem[];
  activeSlug: string;
};

const tabs: TabItem[] = [
  { slug: 'apercu', label: 'Aperçu' },
  { slug: 'activite', label: 'Activité' },
  { slug: 'parametres', label: 'Paramètres' },
];

const meta: Meta<LayoutArgs> = {
  title: 'Composants/Layout',
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...LayoutImports, ButtonComponent] })],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          "Coquille applicative : `app-layout` (conteneur flex), `app-sidebar` (repliable, largeur pilotée), `app-header` (avec onglets optionnels, en lien routeur ou en bouton), `app-content` et `app-footer`. Les `app-layout` s'imbriquent : un layout horizontal pour la barre latérale, un vertical pour la colonne de contenu. En mobile (sous `md`), la barre latérale est masquée et `app-header` affiche un bouton burger qui l'ouvre en surimpression (drawer avec fond) ; la coordination passe par `SidebarService`. Réduire la fenêtre du navigateur pour l'observer.",
      },
    },
  },
  argTypes: {
    direction: { control: 'inline-radio', options: ['auto', 'horizontal', 'vertical'] },
    collapsible: { control: 'boolean' },
    collapsed: { control: 'boolean' },
    sidebarWidth: { control: { type: 'number', min: 120, max: 320, step: 10 } },
    tabs: { control: false },
    activeSlug: { control: 'select', options: ['apercu', 'activite', 'parametres'] },
  },
  args: {
    direction: 'horizontal',
    collapsible: true,
    collapsed: false,
    sidebarWidth: 200,
    tabs,
    activeSlug: 'apercu',
  },
  render: args => ({
    props: args,
    template: `
      <div class="h-[32rem] overflow-hidden border">
        <app-layout [direction]="direction" class="h-full">
          <app-sidebar [width]="sidebarWidth" [collapsible]="collapsible" [collapsed]="collapsed">
            <app-sidebar-group class="p-3">
              <app-sidebar-group-label>Espace</app-sidebar-group-label>
              <a class="rounded-md px-3 py-2.5 text-sm hover:bg-muted">Tableau de bord</a>
              <a class="rounded-md px-3 py-2.5 text-sm hover:bg-muted">Projets</a>
              <a class="rounded-md px-3 py-2.5 text-sm hover:bg-muted">Équipe</a>
            </app-sidebar-group>
          </app-sidebar>

          <app-layout direction="vertical" class="min-w-0 flex-1">
            <app-header class="px-4" [tabs]="tabs" [activeSlug]="activeSlug">
              <p class="text-sm font-medium">Projets</p>
              <div class="ml-auto">
                <button appButton size="sm">Nouveau</button>
              </div>
            </app-header>

            <app-content class="p-4">
              <p class="text-sm text-muted-foreground">
                Contenu principal. La zone défile indépendamment de l'en-tête et du pied.
              </p>
            </app-content>

            <app-footer class="flex items-center px-4 text-xs text-muted-foreground">
              Dernière synchronisation il y a 2 minutes
            </app-footer>
          </app-layout>
        </app-layout>
      </div>
    `,
  }),
};

export default meta;
type Story = StoryObj<LayoutArgs>;

export const Default: Story = {};

export const CollapsedSidebar: Story = { args: { collapsed: true } };

export const WithoutSidebar: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="h-[24rem] overflow-hidden border">
        <app-layout direction="vertical" class="h-full">
          <app-header class="px-4">
            <p class="text-sm font-medium">Réglages</p>
          </app-header>
          <app-content class="p-4">
            <p class="text-sm text-muted-foreground">Page sans navigation latérale.</p>
          </app-content>
        </app-layout>
      </div>
    `,
  }),
};
