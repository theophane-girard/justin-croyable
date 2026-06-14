import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';

import { Badge } from './badge';

const meta = {
  title: 'Composants/Badge',
  component: Badge,
  args: { children: 'Nouveau', variant: 'primary' },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'destructive', 'success', 'outline'],
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Variants: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      <Badge variant="primary">Primary</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Erreur</Badge>
      <Badge variant="success">Succès</Badge>
      <Badge variant="outline">Outline</Badge>
    </View>
  ),
};
