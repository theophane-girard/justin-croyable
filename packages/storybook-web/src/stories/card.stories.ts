import { ButtonComponent, CardComponent } from '@justin-croyable/design-system';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';

type CardArgs = {
  title: string;
  description: string;
  action: string;
  headerBorder: boolean;
  footerBorder: boolean;
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
          "Le contenu passe par projection : le corps est le contenu par défaut, le pied de carte est projeté via l'attribut `card-footer` (masqué automatiquement s'il est vide). `title` et `description` acceptent une chaîne ou un `TemplateRef`.",
      },
    },
  },
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
    action: { control: 'text', description: 'Libellé du bouton d’action de l’en-tête.' },
    headerBorder: { control: 'boolean' },
    footerBorder: { control: 'boolean' },
  },
  args: {
    title: 'Abonnement',
    description: 'Gérez votre formule et votre facturation.',
    action: '',
    headerBorder: false,
    footerBorder: false,
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
