import {
  FabButtonComponent,
  type FabButtonPosition,
  type FabButtonSize,
  type FabButtonType,
} from '@justin-croyable/design-system';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  phosphorPencilSimple,
  phosphorPlus,
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
};

const meta: Meta<FabButtonArgs> = {
  title: 'Composants/FabButton',
  component: FabButtonComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({ imports: [NgIcon] }),
    applicationConfig({
      providers: [
        provideIcons({ phosphorPlus, phosphorPencilSimple, phosphorTrash }),
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
  },
  args: {
    variant: 'default',
    size: 'default',
    position: 'static',
    loading: false,
    fabDisabled: false,
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
