import type { Meta, StoryObj } from '@storybook/react';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './card';
import { Text } from './text';
import { Button } from './button';
import { Badge } from './badge';

const meta = {
  title: 'Composants/Card',
  component: Card,
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Complete: Story = {
  render: () => (
    <Card>
      <CardHeader>
        <CardTitle>Abonnement Pro</CardTitle>
        <CardDescription>Facturation mensuelle, sans engagement.</CardDescription>
      </CardHeader>
      <CardContent>
        <Text>Accès illimité à toutes les fonctionnalités.</Text>
        <Badge variant="success">Actif</Badge>
      </CardContent>
      <CardFooter>
        <Button variant="outline">Annuler</Button>
        <Button className="flex-1">Gérer</Button>
      </CardFooter>
    </Card>
  ),
};

export const Simple: Story = {
  render: () => (
    <Card>
      <Text variant="h4">Carte simple</Text>
      <Text tone="muted">Un contenu libre dans une surface surélevée.</Text>
    </Card>
  ),
};
