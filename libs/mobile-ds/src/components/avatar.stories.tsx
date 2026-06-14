import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';

import { Avatar } from './avatar';

const meta = {
  title: 'Composants/Avatar',
  component: Avatar,
  args: { name: 'Théo Girard', size: 'md' },
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg', 'xl'] },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Initiales: Story = {};

export const Image: Story = {
  args: {
    source: { uri: 'https://i.pravatar.cc/150?img=12' },
    name: 'Théo Girard',
  },
};

export const Tailles: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Avatar name="A B" size="sm" />
      <Avatar name="C D" size="md" />
      <Avatar name="E F" size="lg" />
      <Avatar name="G H" size="xl" />
    </View>
  ),
};
