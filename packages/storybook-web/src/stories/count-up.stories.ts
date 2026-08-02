import { CountUpDirective } from '@justin-croyable/design-system';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';

type CountUpArgs = {
  value: number;
  duration: number;
};

const meta: Meta<CountUpArgs> = {
  title: 'Directives/Compteur animé',
  decorators: [moduleMetadata({ imports: [CountUpDirective] })],
  tags: ['autodocs'],
  argTypes: {
    value: { control: 'number' },
    duration: { control: { type: 'number', min: 0, step: 100 } },
  },
  args: { value: 1250, duration: 1000 },
  render: args => ({
    props: args,
    template: `
      <span
        appCountUp
        [duration]="duration"
        class="text-5xl font-bold tabular-nums text-foreground"
      >{{ value }}</span>
    `,
  }),
};

export default meta;
type Story = StoryObj<CountUpArgs>;

export const Default: Story = {};

export const Incremente: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <span appCountUp class="text-5xl font-bold tabular-nums text-foreground">4096</span>
    `,
  }),
};

export const Decremente: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <span appCountUp class="text-5xl font-bold tabular-nums text-destructive">-42</span>
    `,
  }),
};

export const AvecDecimales: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <span appCountUp class="text-5xl font-bold tabular-nums text-foreground">98.60</span>
    `,
  }),
};

export const DureePlusLongue: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <span appCountUp [duration]="3000" class="text-5xl font-bold tabular-nums text-foreground">1000000</span>
    `,
  }),
};
