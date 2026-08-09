import {
  ChipComponent,
  type ChipShape,
  type ChipVariant,
} from '@justin-croyable/design-system/components/chip';
import { provideIcons } from '@ng-icons/core';
import { phosphorFunnel, phosphorLeaf, phosphorTag, phosphorX } from '@ng-icons/phosphor-icons/regular';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, fn, userEvent } from 'storybook/test';

const DEMO_IMAGE =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMTIiIGZpbGw9IiM0ZjQ2ZTUiLz48L3N2Zz4=';

type ChipArgs = {
  variant: ChipVariant;
  shape: ChipShape;
  disabled: boolean;
  label: string;
  imgUrl: string;
  icon: string;
  hint: string;
  removed: () => void;
};

const meta: Meta<ChipArgs> = {
  title: 'Composants/Chip',
  component: ChipComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [provideIcons({ phosphorX, phosphorTag, phosphorLeaf, phosphorFunnel })],
    }),
  ],
  parameters: {
    docs: {
      description: {
        component:
          "Tag de couleur neutre doté d'une icône de fermeture, utilisé pour afficher des filtres actifs ou des éléments sélectionnés. Un clic sur la croix émet l'événement `removed`. Une image (`imgUrl`) ou une icône (`icon`) de tête et une indication secondaire (`hint`) peuvent être ajoutées. Les couleurs reposent sur les tokens sémantiques du thème (`secondary`, `border`, `foreground`, `muted-foreground`) et s'adaptent donc automatiquement au mode sombre.",
      },
    },
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['default', 'outline', 'accent'] },
    shape: { control: 'inline-radio', options: ['default', 'pill'] },
    disabled: { control: 'boolean' },
    label: { control: 'text' },
    imgUrl: { control: 'text', description: 'Image de tête (prioritaire sur `icon`).' },
    icon: {
      control: 'select',
      options: ['', 'phosphorTag', 'phosphorLeaf', 'phosphorFunnel'],
      description: "Icône de tête (`ng-icon`), affichée si `imgUrl` est vide.",
    },
    hint: { control: 'text', description: 'Indication secondaire atténuée (ex. un compteur).' },
    removed: { action: 'removed' },
  },
  args: {
    variant: 'default',
    shape: 'pill',
    disabled: false,
    label: 'Statut : Actif',
    imgUrl: '',
    icon: '',
    hint: '',
    removed: fn(),
  },
  render: args => ({
    props: args,
    template: `
      <app-chip
        [variant]="variant"
        [shape]="shape"
        [disabled]="disabled"
        [imgUrl]="imgUrl"
        [icon]="icon || undefined"
        [hint]="hint"
        (removed)="removed()"
      >{{ label }}</app-chip>
    `,
  }),
};

export default meta;
type Story = StoryObj<ChipArgs>;

export const Default: Story = {};

export const Variants: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="flex flex-wrap items-center gap-2">
        <app-chip variant="default">Neutre</app-chip>
        <app-chip variant="outline">Contour</app-chip>
        <app-chip variant="accent">Accentué</app-chip>
      </div>
    `,
  }),
};

export const Shapes: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="flex flex-wrap items-center gap-2">
        <app-chip shape="pill">Pilule</app-chip>
        <app-chip shape="default">Arrondi</app-chip>
      </div>
    `,
  }),
};

export const AvecIcone: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story: "Une icône de tête (`icon`) précise la nature du chip — ici le type de filtre.",
      },
    },
  },
  render: () => ({
    template: `
      <div class="flex flex-wrap items-center gap-2">
        <app-chip icon="phosphorTag">Catégorie : Vêtements</app-chip>
        <app-chip icon="phosphorLeaf" variant="accent">Bio</app-chip>
        <app-chip icon="phosphorFunnel">Filtre avancé</app-chip>
      </div>
    `,
  }),
};

export const AvecImage: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          "Une image de tête (`imgUrl`) — avatar, miniature ou sprite. Elle est prioritaire sur `icon`.",
      },
    },
  },
  render: () => ({
    props: { image: DEMO_IMAGE },
    template: `
      <div class="flex flex-wrap items-center gap-2">
        <app-chip [imgUrl]="image">Dracaufeu</app-chip>
        <app-chip [imgUrl]="image" variant="accent">Tortank</app-chip>
      </div>
    `,
  }),
};

export const AvecIndice: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story: "Une indication secondaire atténuée (`hint`) affichée après le libellé, ex. un total.",
      },
    },
  },
  render: () => ({
    template: `
      <div class="flex flex-wrap items-center gap-2">
        <app-chip hint="534">Dracaufeu</app-chip>
        <app-chip hint="530">Tortank</app-chip>
        <app-chip hint="12">Panier</app-chip>
      </div>
    `,
  }),
};

export const ImageEtIndice: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story: "Combinaison image + libellé + indice : un élément sélectionné riche, ex. un Pokémon et son total de statistiques.",
      },
    },
  },
  render: () => ({
    props: { image: DEMO_IMAGE },
    template: `
      <div class="flex flex-wrap items-center gap-2">
        <app-chip [imgUrl]="image" hint="634">Méga-Dracaufeu X</app-chip>
        <app-chip [imgUrl]="image" hint="600">Léviator</app-chip>
      </div>
    `,
  }),
};

export const Filtres: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          "Cas d'usage historique : une barre de filtres actifs. Chaque chip représente un critère appliqué et peut être retiré via sa croix.",
      },
    },
  },
  render: () => ({
    template: `
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-sm text-muted-foreground">Filtres actifs :</span>
        <app-chip>Catégorie : Vêtements</app-chip>
        <app-chip>Prix : 10 € – 50 €</app-chip>
        <app-chip>Disponible en stock</app-chip>
        <app-chip>Note : 4★ et plus</app-chip>
      </div>
    `,
  }),
};

export const Accent: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          "Variante teintée (couleur primaire atténuée), à réserver au filtre mis en avant : le critère structurant venant d'une recherche facettée (ex. la catégorie sélectionnée depuis la barre de recherche), qu'on veut distinguer des filtres secondaires neutres appliqués par-dessus.",
      },
    },
  },
  render: () => ({
    template: `
      <div class="flex flex-wrap items-center gap-2">
        <app-chip variant="accent">Catégorie : Ordinateurs portables</app-chip>
        <app-chip>Marque : Dell</app-chip>
        <app-chip>Prix : 500 € – 1000 €</app-chip>
        <app-chip>Disponible en stock</app-chip>
      </div>
    `,
  }),
};

export const Disabled: Story = {
  args: { disabled: true, label: 'Filtre verrouillé' },
};

export const RemoveEmitsEvent: Story = {
  args: { removed: fn() },
  play: async ({ canvasElement, args }) => {
    const removeButton = canvasElement.querySelector<HTMLButtonElement>('[data-slot="chip-remove"]');
    expect(removeButton).not.toBeNull();

    await userEvent.click(removeButton as HTMLButtonElement);
    expect(args.removed).toHaveBeenCalled();
  },
};
