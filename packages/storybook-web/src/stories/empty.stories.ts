import { ButtonComponent, EmptyComponent } from '@justin-croyable/design-system';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';

type EmptyArgs = {
  icon: string;
  title: string;
  description: string;
};

const meta: Meta<EmptyArgs> = {
  title: 'Composants/Empty',
  component: EmptyComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [ButtonComponent] })],
  parameters: {
    docs: {
      description: {
        component:
          "État vide. `icon` attend un nom d'icône déjà enregistré (les icônes lucide utilisées par les stories le sont globalement dans `preview.ts`). `title`, `description` et `image` acceptent aussi un `TemplateRef` quand le contenu n'est pas du texte simple.",
      },
    },
  },
  argTypes: {
    icon: {
      control: 'select',
      options: ['lucideInbox', 'lucideSearch', 'lucideFolder', 'lucideFileText'],
    },
    title: { control: 'text' },
    description: { control: 'text' },
  },
  args: {
    icon: 'lucideInbox',
    title: 'Aucun message',
    description: 'Votre boîte est vide. Les nouveaux messages apparaîtront ici.',
  },
  render: args => ({
    props: args,
    template: `
      <div class="w-[32rem] rounded-lg border border-dashed">
        <app-empty [icon]="icon" [title]="title" [description]="description" />
      </div>
    `,
  }),
};

export default meta;
type Story = StoryObj<EmptyArgs>;

export const Default: Story = {};

export const NoResults: Story = {
  args: {
    icon: 'lucideSearch',
    title: 'Aucun résultat',
    description: 'Essayez d’élargir votre recherche ou de retirer un filtre.',
  },
};

/** Avec une action : le contenu projeté se place sous la description. */
export const WithAction: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="w-[32rem] rounded-lg border border-dashed">
        <app-empty
          icon="lucideFolder"
          title="Aucun projet"
          description="Créez un premier projet pour commencer."
        >
          <div class="flex gap-2">
            <button appButton>Créer un projet</button>
            <button appButton variant="outline">Importer</button>
          </div>
        </app-empty>
      </div>
    `,
  }),
};
