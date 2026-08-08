import { PageSkeletonImports } from '@justin-croyable/design-system/components/page-skeleton';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';

const meta: Meta = {
  title: 'Composants/Page skeleton',
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...PageSkeletonImports] })],
  parameters: {
    docs: {
      description: {
        component:
          "Squelettes prêts à l'emploi par type de page, composés à partir de `app-skeleton`. À afficher pendant le chargement d'une route ou de données pour préserver la mise en page. Chaque squelette expose des `input` pour ajuster le nombre d'éléments (cartes, lignes, tuiles, champs, sections).",
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Header: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `<app-page-header-skeleton class="w-full max-w-3xl" [withActions]="true" />`,
  }),
};

export const Dashboard: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `<app-dashboard-page-skeleton class="w-full max-w-5xl" />`,
  }),
};

export const Table: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `<app-table-page-skeleton class="w-full max-w-5xl" [statCount]="3" [rowCount]="6" />`,
  }),
};

export const Grid: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `<app-grid-page-skeleton class="w-full max-w-5xl" [tileCount]="10" />`,
  }),
};

export const Form: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `<app-form-page-skeleton [fieldCount]="4" />`,
  }),
};

export const Detail: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `<app-detail-page-skeleton [sectionCount]="3" />`,
  }),
};
