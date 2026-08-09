import { CellUserComponent } from '@justin-croyable/design-system/components/table';
import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, waitFor } from 'storybook/test';

type CellUserArgs = {
  firstName: string;
  lastName: string;
  email: string;
  avatarSrc: string;
  size: 'sm' | 'default' | 'lg';
};

const AVATAR_URL = 'https://i.pravatar.cc/80?img=12';

const meta: Meta<CellUserArgs> = {
  title: 'Composants/Table/Cell user',
  component: CellUserComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          "Cellule utilisateur basée sur `app-avatar` : un avatar (photo ou initiales), le prénom et le nom sur la première ligne et l'email en secondaire. Quand le prénom et le nom sont absents, l'email prend la place du libellé principal et sert d'initiale de repli.",
      },
    },
  },
  argTypes: {
    firstName: { control: 'text' },
    lastName: { control: 'text' },
    email: { control: 'text' },
    avatarSrc: { control: 'text' },
    size: { control: 'select', options: ['sm', 'default', 'lg'] },
  },
  args: {
    firstName: 'Théophane',
    lastName: 'Girard',
    email: 'theophane.girard@sensinov.com',
    avatarSrc: AVATAR_URL,
    size: 'default',
  },
  render: (args) => ({
    props: args,
    template: `
      <app-cell-user
        [firstName]="firstName"
        [lastName]="lastName"
        [email]="email"
        [avatarSrc]="avatarSrc"
        [size]="size"
      />
    `,
  }),
};

export default meta;
type Story = StoryObj<CellUserArgs>;

export const Default: Story = {};

export const SansPhoto: Story = {
  args: { avatarSrc: '' },
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      expect(canvasElement.textContent).toContain('Théophane Girard');
      expect(canvasElement.textContent).toContain('TG');
    });
  },
};

export const RepliEmail: Story = {
  args: { firstName: '', lastName: '', avatarSrc: '' },
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      expect(canvasElement.textContent).toContain('theophane.girard@sensinov.com');
      expect(canvasElement.textContent).toContain('T');
    });
  },
};

export const Tailles: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    props: { avatar: AVATAR_URL },
    template: `
      <div class="flex flex-col gap-4">
        <app-cell-user
          size="sm"
          firstName="Ada"
          lastName="Lovelace"
          email="ada@exemple.fr"
          [avatarSrc]="avatar"
        />
        <app-cell-user
          size="default"
          firstName="Ada"
          lastName="Lovelace"
          email="ada@exemple.fr"
          [avatarSrc]="avatar"
        />
        <app-cell-user
          size="lg"
          firstName="Ada"
          lastName="Lovelace"
          email="ada@exemple.fr"
          [avatarSrc]="avatar"
        />
      </div>
    `,
  }),
};
