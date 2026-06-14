import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';

import { BottomSheet } from './bottom-sheet';
import { Button } from './button';
import { Text } from './text';

const meta = {
  title: 'Composants/BottomSheet',
  component: BottomSheet,
  args: { visible: false },
} satisfies Meta<typeof BottomSheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onPress={() => setOpen(true)}>Ouvrir la feuille</Button>
        <BottomSheet
          visible={open}
          onClose={() => setOpen(false)}
          title="Options de partage"
        >
          <View className="gap-3 px-2">
            <Text>Partagez ce contenu via votre application préférée.</Text>
            <Button onPress={() => setOpen(false)}>Partager</Button>
            <Button variant="ghost" onPress={() => setOpen(false)}>
              Annuler
            </Button>
          </View>
        </BottomSheet>
      </>
    );
  },
};
