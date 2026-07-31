import { SliderComponent } from '@justin-croyable/design-system';
import type { Meta, StoryObj } from '@storybook/angular';

type SliderArgs = {
  min: number;
  max: number;
  step: number;
  default: number[];
  orientation: 'horizontal' | 'vertical';
  disabled: boolean;
};

const meta: Meta<SliderArgs> = {
  title: 'Composants/Slider',
  component: SliderComponent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          "Curseur mono ou multi-poignées : le nombre de valeurs dans `default` détermine le nombre de poignées, deux valeurs donnant un intervalle. La position se manipule à la souris comme au clavier, et `slideIndexChange` émet à chaque déplacement.",
      },
    },
  },
  argTypes: {
    min: { control: 'number' },
    max: { control: 'number' },
    step: { control: { type: 'number', min: 1, max: 25 } },
    default: { control: 'object' },
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
    disabled: { control: 'boolean' },
  },
  args: {
    min: 0,
    max: 100,
    step: 1,
    default: [40],
    orientation: 'horizontal',
    disabled: false,
  },
  render: args => ({
    props: args,
    template: `
      <div [class]="orientation === 'vertical' ? 'h-64' : 'w-80'">
        <app-slider
          [min]="min"
          [max]="max"
          [step]="step"
          [default]="default"
          [orientation]="orientation"
          [disabled]="disabled"
        />
      </div>
    `,
  }),
};

export default meta;
type Story = StoryObj<SliderArgs>;

export const Default: Story = {};

export const Range: Story = { args: { default: [25, 75] } };

export const Steps: Story = { args: { step: 10, default: [50] } };

export const Vertical: Story = { args: { orientation: 'vertical' } };

export const Disabled: Story = { args: { disabled: true } };
