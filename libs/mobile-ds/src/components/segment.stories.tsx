import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { Segment } from './segment';

const meta = {
  title: 'Composants/Segment',
  component: Segment,
  args: {
    value: 'jour',
    options: [
      { label: 'Jour', value: 'jour' },
      { label: 'Semaine', value: 'semaine' },
      { label: 'Mois', value: 'mois' },
    ],
  },
} satisfies Meta<typeof Segment>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => {
    const [value, setValue] = useState(args.value);
    return <Segment {...args} value={value} onValueChange={setValue} />;
  },
};

export const DeuxOptions: Story = {
  render: () => {
    const [value, setValue] = useState('liste');
    return (
      <Segment
        value={value}
        onValueChange={setValue}
        options={[
          { label: 'Liste', value: 'liste' },
          { label: 'Grille', value: 'grille' },
        ]}
      />
    );
  },
};
