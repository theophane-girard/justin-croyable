import { ChipComponent, type ChipShape, type ChipVariant } from '@justin-croyable/design-system';
import { provideIcons } from '@ng-icons/core';
import { phosphorX } from '@ng-icons/phosphor-icons/regular';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, fn, userEvent } from 'storybook/test';

type ChipArgs = {
  variant: ChipVariant;
  shape: ChipShape;
  disabled: boolean;
  label: string;
  removed: () => void;
};

const meta: Meta<ChipArgs> = {
  title: 'Composants/Chip',
  component: ChipComponent,
  tags: ['autodocs'],
  decorators: [applicationConfig({ providers: [provideIcons({ phosphorX })] })],
  parameters: {
    docs: {
      description: {
        component:
          "Tag de couleur neutre doté d'une icône de fermeture, utilisé exclusivement pour afficher les filtres actifs. Un clic sur la croix émet l'événement `removed`. Les couleurs reposent sur les tokens sémantiques du thème (`secondary`, `border`, `foreground`) et s'adaptent donc automatiquement au mode sombre.",
      },
    },
  },
  argTypes: {
    variant: { control: 'inline-radio', options: ['default', 'outline', 'accent'] },
    shape: { control: 'inline-radio', options: ['default', 'pill'] },
    disabled: { control: 'boolean' },
    label: { control: 'text' },
    removed: { action: 'removed' },
  },
  args: {
    variant: 'default',
    shape: 'pill',
    disabled: false,
    label: 'Statut : Actif',
    removed: fn(),
  },
  render: args => ({
    props: args,
    template: `
      <app-chip
        [variant]="variant"
        [shape]="shape"
        [disabled]="disabled"
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

export const Filtres: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          "Cas d'usage principal : une barre de filtres actifs. Chaque chip représente un critère appliqué et peut être retiré via sa croix.",
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
