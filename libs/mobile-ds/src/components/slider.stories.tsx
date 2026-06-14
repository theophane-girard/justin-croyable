import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';

import { Slider, RangeSlider } from './slider';
import { Text } from './text';

const meta = {
  title: 'Composants/Slider',
  component: Slider,
  args: { value: 40 },
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Valeur: Story = {
  render: () => {
    const [value, setValue] = useState(40);
    return (
      <View style={{ gap: 8 }}>
        <Text weight="medium">Volume : {value}</Text>
        <Slider value={value} onValueChange={setValue} />
      </View>
    );
  },
};

export const Pas: Story = {
  render: () => {
    const [value, setValue] = useState(2);
    return (
      <View style={{ gap: 8 }}>
        <Text weight="medium">Note : {value} / 5</Text>
        <Slider
          value={value}
          onValueChange={setValue}
          minimumValue={0}
          maximumValue={5}
          step={1}
        />
      </View>
    );
  },
};

export const Plage: StoryObj<typeof RangeSlider> = {
  render: () => {
    const [range, setRange] = useState<[number, number]>([20, 70]);
    return (
      <View style={{ gap: 8 }}>
        <Text weight="medium">
          Prix : {range[0]} € – {range[1]} €
        </Text>
        <RangeSlider values={range} onValuesChange={setRange} />
      </View>
    );
  },
};
