import { ButtonComponent } from '@justin-croyable/design-system/components/button';
import {
  type CardBackdropVariants,
  CardComponent,
  type CardShadowVariants,
} from '@justin-croyable/design-system/components/card';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';

type CardArgs = {
  title: string;
  description: string;
  action: string;
  headerBorder: boolean;
  footerBorder: boolean;
  shadow: CardShadowVariants;
  backdrop: CardBackdropVariants;
};

const meta: Meta<CardArgs> = {
  title: 'Composants/Card',
  component: CardComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [ButtonComponent] })],
  parameters: {
    docs: {
      description: {
        component:
          "Le contenu passe par projection : le corps est le contenu par défaut, le pied de carte est projeté via l'attribut `card-footer` (corps comme pied sont masqués automatiquement s'ils sont vides). `title` et `description` acceptent une chaîne ou un `TemplateRef`. `shadow` règle l'élévation et `backdrop` rend le fond translucide et flouté, pour une carte posée au-dessus d'un contenu — image, graphique ou scène 3D.",
      },
    },
  },
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
    action: { control: 'text', description: 'Libellé du bouton d’action de l’en-tête.' },
    headerBorder: { control: 'boolean' },
    footerBorder: { control: 'boolean' },
    shadow: { control: 'inline-radio', options: ['none', 'sm', 'md', 'lg'] },
    backdrop: { control: 'inline-radio', options: ['opaque', 'blur'] },
  },
  args: {
    title: 'Abonnement',
    description: 'Gérez votre formule et votre facturation.',
    action: '',
    headerBorder: false,
    footerBorder: false,
    shadow: 'sm',
    backdrop: 'opaque',
  },
  render: args => ({
    props: args,
    template: `
      <app-card
        class="w-96"
        [title]="title"
        [description]="description"
        [action]="action"
        [headerBorder]="headerBorder"
        [footerBorder]="footerBorder"
        [shadow]="shadow"
        [backdrop]="backdrop"
      >
        <p class="text-sm text-muted-foreground">
          Formule Pro — renouvellement le 12 août. 3 sièges utilisés sur 5.
        </p>

        <div card-footer class="w-full flex-row justify-end gap-2">
          <button appButton variant="ghost">Annuler</button>
          <button appButton>Mettre à niveau</button>
        </div>
      </app-card>
    `,
  }),
};

export default meta;
type Story = StoryObj<CardArgs>;

export const Default: Story = {};

export const WithAction: Story = {
  args: { action: 'Modifier', headerBorder: true, footerBorder: true },
};

export const SurUnFond: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div
        class="relative flex h-64 w-[28rem] items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary/40 via-accent to-primary/20"
      >
        <app-card
          class="absolute top-4 left-4 w-56"
          backdrop="blur"
          shadow="md"
          title="Tomate"
          description="Légume · 3 plants · 4 kg"
        />
      </div>
    `,
  }),
};

export const ContentOnly: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <app-card class="w-96">
        <div class="flex items-center gap-3">
          <div class="size-10 rounded-full bg-primary/15"></div>
          <div>
            <p class="text-sm font-medium">Théophane</p>
            <p class="text-xs text-muted-foreground">Propriétaire de l'espace</p>
          </div>
        </div>
      </app-card>
    `,
  }),
};
