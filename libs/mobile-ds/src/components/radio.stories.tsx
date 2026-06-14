import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { RadioGroup, Radio } from './radio';

const meta = {
  title: 'Composants/Radio',
  component: RadioGroup,
  args: { children: null },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: () => {
    const [value, setValue] = useState('standard');
    return (
      <RadioGroup value={value} onValueChange={setValue}>
        <Radio value="standard" label="Livraison standard (gratuite)" />
        <Radio value="express" label="Livraison express (4,99 €)" />
        <Radio value="point" label="Point relais (2,99 €)" />
        <Radio value="indispo" label="Option indisponible" disabled />
      </RadioGroup>
    );
  },
};
