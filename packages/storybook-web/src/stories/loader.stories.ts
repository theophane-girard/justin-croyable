import { LoaderComponent } from '@justin-croyable/design-system';
import type { Meta, StoryObj } from '@storybook/angular-vite';

type LoaderArgs = { size: 'sm' | 'default' | 'lg' };

const meta: Meta<LoaderArgs> = {
  title: 'Composants/Loader',
  component: LoaderComponent,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'default', 'lg'] },
  },
  args: { size: 'default' },
  render: args => ({
    props: args,
    template: `<app-loader [size]="size" />`,
  }),
};

export default meta;
type Story = StoryObj<LoaderArgs>;

export const Default: Story = {};

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="flex items-center gap-6">
        <app-loader size="sm" />
        <app-loader size="default" />
        <app-loader size="lg" />
      </div>
    `,
  }),
};

export const InlineWithText: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="flex items-center gap-2 text-sm text-muted-foreground">
        <app-loader size="sm" />
        Chargement des données…
      </div>
    `,
  }),
};
