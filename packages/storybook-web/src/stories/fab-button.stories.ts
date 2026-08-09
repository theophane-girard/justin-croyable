import {
  type FabButtonBadge,
  FabButtonComponent,
  type FabButtonPosition,
  type FabButtonSize,
  type FabButtonType,
  FabContainerComponent,
  FabListComponent,
} from '@justin-croyable/design-system/components/fab-button';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorCamera,
  phosphorFunnel,
  phosphorHeart,
  phosphorPencilSimple,
  phosphorPlus,
  phosphorShareNetwork,
  phosphorTrash,
} from '@ng-icons/phosphor-icons/regular';
import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular-vite';

type FabButtonArgs = {
  variant: FabButtonType;
  size: FabButtonSize;
  position: FabButtonPosition;
  loading: boolean;
  fabDisabled: boolean;
  badge: FabButtonBadge;
  badgeType: FabButtonType;
};

const meta: Meta<FabButtonArgs> = {
  title: 'Composants/FabButton',
  component: FabButtonComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({ imports: [NgIcon] }),
    applicationConfig({
      providers: [
        provideIcons({
          phosphorPlus,
          phosphorPencilSimple,
          phosphorTrash,
          phosphorCamera,
          phosphorHeart,
          phosphorShareNetwork,
          phosphorFunnel,
        }),
      ],
    }),
  ],
  parameters: {
    docs: {
      description: {
        component:
          "Bouton d'action flottant (FAB), circulaire et surélevé, destiné à l'action principale d'un écran. S'applique en attribut (`<button appFabButton>`) pour conserver la sémantique native du `<button>` ou du `<a>`. L'icône est projetée via `<ng-content>`. L'entrée `position` permet de l'ancrer en overlay (coins de l'écran) ou de le laisser en flux (`static`).",
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'outline', 'destructive'],
    },
    size: { control: 'inline-radio', options: ['sm', 'default', 'lg'] },
    position: {
      control: 'select',
      options: [
        'static',
        'bottom-right',
        'bottom-left',
        'top-right',
        'top-left',
      ],
    },
    loading: { control: 'boolean' },
    fabDisabled: { control: 'boolean' },
    badge: { control: 'text' },
    badgeType: {
      control: 'select',
      options: ['default', 'secondary', 'outline', 'destructive'],
    },
  },
  args: {
    variant: 'default',
    size: 'default',
    position: 'static',
    loading: false,
    fabDisabled: false,
    badge: null,
    badgeType: 'destructive',
  },
  render: (args) => ({
    props: args,
    template: `
      <button
        appFabButton
        [variant]="variant"
        [size]="size"
        [position]="position"
        [loading]="loading"
        [fabDisabled]="fabDisabled"
        [badge]="badge"
        [badgeType]="badgeType"
        aria-label="Ajouter"
      >
        <ng-icon name="phosphorPlus" />
      </button>
    `,
  }),
};

export default meta;
type Story = StoryObj<FabButtonArgs>;

export const Default: Story = {};

export const Variants: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="flex flex-wrap items-center gap-4">
        <button appFabButton variant="default" aria-label="Ajouter">
          <ng-icon name="phosphorPlus" />
        </button>
        <button appFabButton variant="secondary" aria-label="Éditer">
          <ng-icon name="phosphorPencilSimple" />
        </button>
        <button appFabButton variant="outline" aria-label="Éditer">
          <ng-icon name="phosphorPencilSimple" />
        </button>
        <button appFabButton variant="destructive" aria-label="Supprimer">
          <ng-icon name="phosphorTrash" />
        </button>
      </div>
    `,
  }),
};

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="flex flex-wrap items-center gap-4">
        <button appFabButton size="sm" aria-label="Ajouter">
          <ng-icon name="phosphorPlus" />
        </button>
        <button appFabButton size="default" aria-label="Ajouter">
          <ng-icon name="phosphorPlus" />
        </button>
        <button appFabButton size="lg" aria-label="Ajouter">
          <ng-icon name="phosphorPlus" />
        </button>
      </div>
    `,
  }),
};

export const Loading: Story = {
  args: { loading: true },
};

export const Disabled: Story = {
  args: { fabDisabled: true },
};

export const Badge: Story = {
  name: 'Badge (compteur)',
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          "L'entrée `badge` affiche une pastille en surimpression (coin supérieur droit), idéale pour indiquer un compteur comme le nombre de filtres actifs. Elle accepte une chaîne ou un nombre et se masque automatiquement lorsque la valeur est nulle, vide ou `0`. `badgeType` reprend les variantes du composant Badge (`destructive` par défaut).",
      },
    },
  },
  render: () => ({
    template: `
      <div class="flex flex-wrap items-center gap-6">
        <button appFabButton [badge]="3" aria-label="Filtres (3 actifs)">
          <ng-icon name="phosphorFunnel" />
        </button>
        <button appFabButton variant="secondary" badgeType="default" [badge]="12" aria-label="Notifications (12)">
          <ng-icon name="phosphorHeart" />
        </button>
        <button appFabButton variant="outline" size="lg" [badge]="99" aria-label="Messages (99)">
          <ng-icon name="phosphorShareNetwork" />
        </button>
        <button appFabButton size="sm" [badge]="0" aria-label="Aucun filtre actif">
          <ng-icon name="phosphorFunnel" />
        </button>
      </div>
    `,
  }),
};

export const SpeedDial: Story = {
  name: 'Speed dial (sous-boutons)',
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          "Regroupe plusieurs sous-actions derrière un FAB déclencheur (`app-fab` + `app-fab-list`). Au clic, l'icône se transforme en croix et les sous-boutons apparaissent en cascade. La liste se referme au clic sur une action, à l'échappement ou au clic extérieur. `side` (`top`, `bottom`, `start`, `end`) contrôle la direction de déploiement.",
      },
    },
  },
  decorators: [
    moduleMetadata({ imports: [FabContainerComponent, FabListComponent] }),
  ],
  render: () => ({
    template: `
      <div class="relative h-96 w-full overflow-hidden rounded-lg border border-border">
        <app-fab position="bottom-right" triggerLabel="Ouvrir les actions" [badge]="5">
          <app-fab-list side="top">
            <button appFabButton size="sm" variant="secondary" [badge]="2" aria-label="Partager (2)">
              <ng-icon name="phosphorShareNetwork" />
            </button>
            <button appFabButton size="sm" variant="secondary" [badge]="3" aria-label="Photo (3)">
              <ng-icon name="phosphorCamera" />
            </button>
            <button appFabButton size="sm" variant="secondary" aria-label="Favori">
              <ng-icon name="phosphorHeart" />
            </button>
          </app-fab-list>
        </app-fab>
      </div>
    `,
  }),
};

export const SpeedDialSides: Story = {
  name: 'Speed dial — directions',
  parameters: { controls: { disable: true } },
  decorators: [
    moduleMetadata({ imports: [FabContainerComponent, FabListComponent] }),
  ],
  render: () => ({
    template: `
      <div class="grid h-96 w-full grid-cols-2 grid-rows-2 gap-4">
        <div class="relative rounded-lg border border-border p-4">
          <span class="text-sm text-muted-foreground">side="end"</span>
          <app-fab position="static" triggerLabel="Actions">
            <app-fab-list side="end">
              <button appFabButton size="sm" variant="secondary" aria-label="Éditer">
                <ng-icon name="phosphorPencilSimple" />
              </button>
              <button appFabButton size="sm" variant="destructive" aria-label="Supprimer">
                <ng-icon name="phosphorTrash" />
              </button>
            </app-fab-list>
          </app-fab>
        </div>
        <div class="relative flex justify-end rounded-lg border border-border p-4">
          <span class="text-sm text-muted-foreground">side="start"</span>
          <app-fab position="static" triggerLabel="Actions">
            <app-fab-list side="start">
              <button appFabButton size="sm" variant="secondary" aria-label="Éditer">
                <ng-icon name="phosphorPencilSimple" />
              </button>
              <button appFabButton size="sm" variant="destructive" aria-label="Supprimer">
                <ng-icon name="phosphorTrash" />
              </button>
            </app-fab-list>
          </app-fab>
        </div>
        <div class="relative flex items-end rounded-lg border border-border p-4">
          <span class="text-sm text-muted-foreground">side="top"</span>
          <app-fab position="static" triggerLabel="Actions">
            <app-fab-list side="top">
              <button appFabButton size="sm" variant="secondary" aria-label="Éditer">
                <ng-icon name="phosphorPencilSimple" />
              </button>
              <button appFabButton size="sm" variant="destructive" aria-label="Supprimer">
                <ng-icon name="phosphorTrash" />
              </button>
            </app-fab-list>
          </app-fab>
        </div>
        <div class="relative flex items-start justify-end rounded-lg border border-border p-4">
          <span class="text-sm text-muted-foreground">side="bottom"</span>
          <app-fab position="static" triggerLabel="Actions">
            <app-fab-list side="bottom">
              <button appFabButton size="sm" variant="secondary" aria-label="Éditer">
                <ng-icon name="phosphorPencilSimple" />
              </button>
              <button appFabButton size="sm" variant="destructive" aria-label="Supprimer">
                <ng-icon name="phosphorTrash" />
              </button>
            </app-fab-list>
          </app-fab>
        </div>
      </div>
    `,
  }),
};
