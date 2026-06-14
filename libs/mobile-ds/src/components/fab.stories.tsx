import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';
import { Plus, PencilSimple } from 'phosphor-react-native';

import { Fab } from './fab';

const meta = {
  title: 'Composants/Fab',
  component: Fab,
  args: { icon: Plus, accessibilityLabel: 'Ajouter' },
  decorators: [
    (Story) => (
      <View style={{ height: 240 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof Fab>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Regular: Story = {};

export const Extended: Story = {
  args: { label: 'Nouveau', icon: PencilSimple },
};

export const Secondaire: Story = {
  args: { variant: 'secondary' },
};

export const EnBasAGauche: Story = {
  args: { position: 'bottom-left' },
};
