import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';

import { Switch } from './switch';
import { Text } from './text';

const meta = {
  title: 'Composants/Switch',
  component: Switch,
  args: { value: false },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: () => {
    const [on, setOn] = useState(false);
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Switch value={on} onValueChange={setOn} />
        <Text>{on ? 'Activé' : 'Désactivé'}</Text>
      </View>
    );
  },
};

export const Desactive: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 12 }}>
      <Switch value disabled />
      <Switch value={false} disabled />
    </View>
  ),
};
