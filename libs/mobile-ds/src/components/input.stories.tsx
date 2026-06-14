import type { Meta, StoryObj } from '@storybook/react';
import { View } from 'react-native';

import { Input } from './input';

const meta = {
  title: 'Composants/Input',
  component: Input,
  args: { label: 'Email', placeholder: 'vous@exemple.com' },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const AvecAide: Story = {
  args: { label: 'Nom d’utilisateur', hint: '3 à 20 caractères' },
};

export const EnErreur: Story = {
  args: {
    label: 'Mot de passe',
    secureTextEntry: true,
    error: 'Le mot de passe est requis',
  },
};

export const Etats: Story = {
  render: () => (
    <View style={{ gap: 16 }}>
      <Input label="Normal" placeholder="Saisir…" />
      <Input label="Avec aide" hint="Texte d’aide" placeholder="Saisir…" />
      <Input label="Erreur" error="Champ invalide" placeholder="Saisir…" />
    </View>
  ),
};
