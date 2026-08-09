import { PageSkeletonImports } from '@justin-croyable/design-system/components/page-skeletons';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';

const meta: Meta = {
  title: 'Composants/Skeleton — Pages',
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...PageSkeletonImports] })],
  parameters: {
    docs: {
      description: {
        component:
          'Skeletons par type de page, composés à partir des primitives. Ils servent aux deux niveaux : squelette de route (via `provideRouteSkeletons` + `app-skeleton-outlet`) et squelette local dans une page (via `*skeletonWhile`). Aucun input requis : ils sont instanciables par `NgComponentOutlet`.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Generic: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({ template: `<app-generic-skeleton class="w-full max-w-3xl" />` }),
};

export const List: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({ template: `<app-list-skeleton class="w-full max-w-5xl" [rowCount]="6" />` }),
};

export const Detail: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({ template: `<app-detail-skeleton />` }),
};

export const Dashboard: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({ template: `<app-dashboard-skeleton class="w-full max-w-5xl" />` }),
};

export const Map: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `<app-map-skeleton class="h-[32rem] w-full max-w-5xl" />`,
  }),
};

export const Form: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({ template: `<app-form-skeleton />` }),
};

export const Grid: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({ template: `<app-grid-skeleton class="w-full max-w-5xl" [tileCount]="10" />` }),
};
