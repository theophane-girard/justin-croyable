import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';

import { Text } from './text';

const meta = {
  title: 'Composants/Text',
  component: Text,
  args: { children: 'Le vif renard brun saute', variant: 'body', tone: 'default' },
  argTypes: {
    variant: {
      control: 'select',
      options: ['h1', 'h2', 'h3', 'h4', 'bodyLarge', 'body', 'small', 'caption'],
    },
    tone: {
      control: 'select',
      options: ['default', 'muted', 'primary', 'destructive', 'success'],
    },
  },
} satisfies Meta<typeof Text>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Echelle: Story = {
  render: () => (
    <View style={{ gap: 8 }}>
      <Text variant="h1">Titre H1</Text>
      <Text variant="h2">Titre H2</Text>
      <Text variant="h3">Titre H3</Text>
      <Text variant="h4">Titre H4</Text>
      <Text variant="body">Corps de texte</Text>
      <Text variant="small" tone="muted">
        Texte secondaire atténué
      </Text>
      <Text variant="caption" tone="muted">
        Légende
      </Text>
    </View>
  ),
};
