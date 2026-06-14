import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';

import { Checkbox } from './checkbox';

const meta = {
  title: 'Composants/Checkbox',
  component: Checkbox,
  args: { checked: false },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: () => {
    const [checked, setChecked] = useState(false);
    return (
      <Checkbox
        checked={checked}
        onCheckedChange={setChecked}
        label="J’accepte les conditions"
      />
    );
  },
};

export const Etats: Story = {
  render: () => (
    <View style={{ gap: 12 }}>
      <Checkbox checked onCheckedChange={() => undefined} label="Cochée" />
      <Checkbox
        checked={false}
        onCheckedChange={() => undefined}
        label="Décochée"
      />
      <Checkbox checked disabled label="Cochée désactivée" />
    </View>
  ),
};
