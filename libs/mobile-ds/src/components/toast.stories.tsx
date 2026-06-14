import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';

import { ToastProvider, useToast } from './toast';
import { Button } from './button';

function Demo() {
  const { toast } = useToast();
  return (
    <View style={{ gap: 12, paddingTop: 80 }}>
      <Button
        onPress={() => toast({ title: 'Enregistré', variant: 'success' })}
      >
        Succès
      </Button>
      <Button
        variant="destructive"
        onPress={() =>
          toast({
            title: 'Une erreur est survenue',
            description: 'Réessayez dans quelques instants.',
            variant: 'destructive',
          })
        }
      >
        Erreur
      </Button>
      <Button
        variant="outline"
        onPress={() =>
          toast({
            title: 'Nouvelle mise à jour',
            description: 'La version 2.0 est disponible.',
            variant: 'info',
          })
        }
      >
        Info
      </Button>
    </View>
  );
}

const meta = {
  title: 'Composants/Toast',
  component: ToastProvider,
  args: { children: null },
} satisfies Meta<typeof ToastProvider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: () => (
    <ToastProvider>
      <Demo />
    </ToastProvider>
  ),
};
