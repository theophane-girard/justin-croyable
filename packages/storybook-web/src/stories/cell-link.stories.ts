import { CellLinkComponent } from '@justin-croyable/design-system/components/table';
import { type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, waitFor } from 'storybook/test';

type CellLinkArgs = {
  href: string;
  label: string;
};

const meta: Meta<CellLinkArgs> = {
  title: 'Composants/Table/Cell link',
  component: CellLinkComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          "Cellule lien basée sur le variant `link` du bouton du design system. L'ancre s'ouvre dans un nouvel onglet (`target=\"_blank\"`, `rel=\"noopener noreferrer\"`) et affiche une icône Phosphor indiquant l'ouverture externe. Si aucun libellé n'est fourni, l'URL est utilisée.",
      },
    },
  },
  argTypes: {
    href: { control: 'text' },
    label: { control: 'text' },
  },
  args: {
    href: 'https://www.rnm.franceagrimer.fr',
    label: 'Cotations RNM',
  },
  render: (args) => ({
    props: args,
    template: `<app-cell-link [href]="href" [label]="label" />`,
  }),
};

export default meta;
type Story = StoryObj<CellLinkArgs>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const anchor = canvasElement.querySelector('a');
      expect(anchor?.getAttribute('href')).toBe('https://www.rnm.franceagrimer.fr');
      expect(anchor?.getAttribute('target')).toBe('_blank');
      expect(anchor?.getAttribute('rel')).toBe('noopener noreferrer');
    });
  },
};

export const SansLibelle: Story = {
  args: { label: '' },
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      expect(canvasElement.textContent).toContain('https://www.rnm.franceagrimer.fr');
    });
  },
};
