import type { Meta, StoryObj } from '@storybook/react';
import { MagnifyingGlass, DotsThreeVertical } from 'phosphor-react-native';

import { Header } from './header';
import { IconButton } from './icon-button';

const meta = {
  title: 'Composants/Header',
  component: Header,
  args: { title: 'Accueil' },
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Simple: Story = {};

export const AvecRetour: Story = {
  args: { title: 'Détail', subtitle: 'Commande #1234', onBack: () => undefined },
};

export const AvecActions: Story = {
  render: () => (
    <Header
      title="Messages"
      onBack={() => undefined}
      right={
        <>
          <IconButton
            icon={MagnifyingGlass}
            accessibilityLabel="Rechercher"
            onPress={() => undefined}
          />
          <IconButton
            icon={DotsThreeVertical}
            accessibilityLabel="Plus"
            onPress={() => undefined}
          />
        </>
      }
    />
  ),
};
