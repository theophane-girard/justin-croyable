import type { Meta, StoryObj } from '@storybook/react';

import { Accordion, AccordionItem } from './accordion';
import { Text } from './text';

const meta = {
  title: 'Composants/Accordion',
  component: Accordion,
  args: { children: null },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Simple: Story = {
  render: () => (
    <Accordion type="single" defaultValue="livraison">
      <AccordionItem value="livraison" title="Livraison">
        <Text tone="muted">
          Livraison gratuite sous 3 à 5 jours ouvrés en France métropolitaine.
        </Text>
      </AccordionItem>
      <AccordionItem value="retours" title="Retours">
        <Text tone="muted">
          Retours acceptés sous 30 jours, article non utilisé et dans son
          emballage d'origine.
        </Text>
      </AccordionItem>
      <AccordionItem value="paiement" title="Paiement">
        <Text tone="muted">
          Carte bancaire, Apple Pay et Google Pay. Paiement sécurisé.
        </Text>
      </AccordionItem>
    </Accordion>
  ),
};

export const Multiple: Story = {
  render: () => (
    <Accordion type="multiple" defaultValue={['a']}>
      <AccordionItem value="a" title="Première section">
        <Text tone="muted">Plusieurs sections peuvent être ouvertes.</Text>
      </AccordionItem>
      <AccordionItem value="b" title="Deuxième section">
        <Text tone="muted">Celle-ci aussi, en même temps.</Text>
      </AccordionItem>
    </Accordion>
  ),
};
