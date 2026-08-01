import { DividerComponent } from '@justin-croyable/design-system';
import type { Meta, StoryObj } from '@storybook/angular-vite';

type DividerArgs = {
  orientation: 'horizontal' | 'vertical';
  spacing: 'none' | 'sm' | 'default' | 'lg';
};

const meta: Meta<DividerArgs> = {
  title: 'Composants/Divider',
  component: DividerComponent,
  tags: ['autodocs'],
  argTypes: {
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    spacing: { control: 'inline-radio', options: ['none', 'sm', 'default', 'lg'] },
  },
  args: { orientation: 'horizontal', spacing: 'default' },
  render: args => ({
    props: args,
    template: `
      <div class="flex h-24 w-80 items-center" [class.flex-col]="orientation === 'horizontal'">
        <span class="text-sm text-muted-foreground">Avant</span>
        <app-divider [orientation]="orientation" [spacing]="spacing" />
        <span class="text-sm text-muted-foreground">Après</span>
      </div>
    `,
  }),
};

export default meta;
type Story = StoryObj<DividerArgs>;

export const Horizontal: Story = {};

export const Vertical: Story = {
  args: { orientation: 'vertical' },
};

export const Spacings: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="w-80">
        @for (spacing of ['none', 'sm', 'default', 'lg']; track spacing) {
          <p class="text-xs text-muted-foreground">spacing="{{ spacing }}"</p>
          <app-divider [spacing]="spacing" />
        }
      </div>
    `,
  }),
};
