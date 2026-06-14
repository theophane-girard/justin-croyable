import type { Meta, StoryObj } from '@storybook/react';

import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';
import { Text } from './text';

const meta = {
  title: 'Composants/Tabs',
  component: Tabs,
  args: { children: null },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Simple: Story = {
  render: () => (
    <Tabs defaultValue="apercu">
      <TabsList>
        <TabsTrigger value="apercu" label="Aperçu" />
        <TabsTrigger value="avis" label="Avis" />
        <TabsTrigger value="specs" label="Specs" />
      </TabsList>
      <TabsContent value="apercu">
        <Text tone="muted">Présentation générale du produit.</Text>
      </TabsContent>
      <TabsContent value="avis">
        <Text tone="muted">Les avis des clients sur ce produit.</Text>
      </TabsContent>
      <TabsContent value="specs">
        <Text tone="muted">Caractéristiques techniques détaillées.</Text>
      </TabsContent>
    </Tabs>
  ),
};
