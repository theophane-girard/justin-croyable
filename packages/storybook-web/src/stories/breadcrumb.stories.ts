import { BreadcrumbImports } from '@justin-croyable/design-system';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';

type BreadcrumbArgs = {
  size: 'sm' | 'md' | 'lg';
  align: 'start' | 'center' | 'end';
  wrap: 'wrap' | 'nowrap';
  separator: string;
};

const meta: Meta<BreadcrumbArgs> = {
  title: 'Composants/Breadcrumb',
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...BreadcrumbImports] })],
  parameters: {
    docs: {
      description: {
        component:
          "Le dernier élément est automatiquement traité comme la page courante (non cliquable). La navigation passe par l'entrée `link` et non `routerLink`, pour éviter que la directive RouterLink ne matche aussi l'hôte. Le séparateur par défaut est un chevron ; `separator` accepte une chaîne ou un `TemplateRef`.",
      },
    },
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    align: { control: 'inline-radio', options: ['start', 'center', 'end'] },
    wrap: { control: 'inline-radio', options: ['wrap', 'nowrap'] },
    separator: { control: 'text', description: 'Vide = chevron par défaut.' },
  },
  args: { size: 'md', align: 'start', wrap: 'wrap', separator: '' },
  render: args => ({
    props: args,
    template: `
      <div class="w-[32rem]">
        <app-breadcrumb [size]="size" [align]="align" [wrap]="wrap" [separator]="separator">
          <app-breadcrumb-item [link]="['/']">Accueil</app-breadcrumb-item>
          <app-breadcrumb-item [link]="['/equipe']">Équipe</app-breadcrumb-item>
          <app-breadcrumb-item [link]="['/equipe/roles']">Rôles</app-breadcrumb-item>
          <app-breadcrumb-item>Administrateur</app-breadcrumb-item>
        </app-breadcrumb>
      </div>
    `,
  }),
};

export default meta;
type Story = StoryObj<BreadcrumbArgs>;

export const Default: Story = {};

export const CustomSeparator: Story = { args: { separator: '/' } };

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="flex w-[32rem] flex-col gap-4">
        @for (size of ['sm', 'md', 'lg']; track size) {
          <app-breadcrumb [size]="size">
            <app-breadcrumb-item [link]="['/']">Accueil</app-breadcrumb-item>
            <app-breadcrumb-item [link]="['/projets']">Projets</app-breadcrumb-item>
            <app-breadcrumb-item>{{ size }}</app-breadcrumb-item>
          </app-breadcrumb>
        }
      </div>
    `,
  }),
};

/** Chemin long tronqué : `app-breadcrumb-ellipsis` marque l'élément replié. */
export const WithEllipsis: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="w-[32rem]">
        <app-breadcrumb>
          <app-breadcrumb-item [link]="['/']">Accueil</app-breadcrumb-item>
          <app-breadcrumb-item>
            <app-breadcrumb-ellipsis>…</app-breadcrumb-ellipsis>
          </app-breadcrumb-item>
          <app-breadcrumb-item [link]="['/equipe/roles']">Rôles</app-breadcrumb-item>
          <app-breadcrumb-item>Administrateur</app-breadcrumb-item>
        </app-breadcrumb>
      </div>
    `,
  }),
};
