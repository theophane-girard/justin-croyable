import { CommandImports } from '@justin-croyable/design-system';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

type CommandArgs = {
  size: 'sm' | 'default' | 'lg' | 'xl';
  placeholder: string;
};

const meta: Meta<CommandArgs> = {
  title: 'Composants/Command',
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...CommandImports] })],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          "Palette de commandes composable : `app-command-input` filtre, `app-command-list` cadre le défilement, `app-command-empty` s'affiche quand le filtre ne renvoie rien. La navigation clavier (flèches, Entrée, Échap) est gérée par le conteneur via le plugin d'events de `provideZard()`.",
      },
    },
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'default', 'lg', 'xl'] },
    placeholder: { control: 'text' },
  },
  args: { size: 'default', placeholder: 'Tapez une commande ou recherchez…' },
  render: args => ({
    props: args,
    template: `
      <div class="w-[28rem]">
        <app-command [size]="size">
          <app-command-input [placeholder]="placeholder" />
          <app-command-list>
            <app-command-empty>Aucun résultat.</app-command-empty>

            <app-command-option-group label="Suggestions">
              <app-command-option value="calendar" label="Calendrier" icon="lucideCalendar" />
              <app-command-option value="search" label="Rechercher un fichier" icon="lucideSearch" shortcut="⌘K" />
              <app-command-option value="inbox" label="Boîte de réception" icon="lucideInbox" />
            </app-command-option-group>

            <app-command-divider />

            <app-command-option-group label="Paramètres">
              <app-command-option value="profile" label="Profil" icon="lucideFileText" shortcut="⌘P" />
              <app-command-option value="billing" label="Facturation" icon="lucideFolder" [disabled]="true" />
            </app-command-option-group>
          </app-command-list>
        </app-command>
      </div>
    `,
  }),
};

export default meta;
type Story = StoryObj<CommandArgs>;

export const Default: Story = {};

export const Small: Story = { args: { size: 'sm' } };

export const ExtraLarge: Story = { args: { size: 'xl' } };

/** Liste plate, sans regroupement. */
export const Flat: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="w-[28rem]">
        <app-command size="sm">
          <app-command-input placeholder="Rechercher une action…" />
          <app-command-list>
            <app-command-empty>Aucun résultat.</app-command-empty>
            <app-command-option value="new" label="Nouveau document" shortcut="⌘N" />
            <app-command-option value="open" label="Ouvrir…" shortcut="⌘O" />
            <app-command-option value="save" label="Enregistrer" shortcut="⌘S" />
          </app-command-list>
        </app-command>
      </div>
    `,
  }),
};
