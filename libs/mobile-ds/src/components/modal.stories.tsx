import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { Modal } from './modal';
import { Button } from './button';
import { Text } from './text';

const meta = {
  title: 'Composants/Modal',
  component: Modal,
  args: { visible: false },
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: () => {
    const [visible, setVisible] = useState(false);
    return (
      <>
        <Button onPress={() => setVisible(true)}>Ouvrir la modale</Button>
        <Modal
          visible={visible}
          onClose={() => setVisible(false)}
          title="Supprimer l’élément ?"
        >
          <Text tone="muted">Cette action est irréversible.</Text>
          <Button variant="destructive" onPress={() => setVisible(false)}>
            Supprimer
          </Button>
          <Button variant="ghost" onPress={() => setVisible(false)}>
            Annuler
          </Button>
        </Modal>
      </>
    );
  },
};
