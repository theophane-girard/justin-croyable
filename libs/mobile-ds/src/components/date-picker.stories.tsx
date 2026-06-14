import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { DatePicker } from './date-picker';

const meta = {
  title: 'Composants/DatePicker',
  component: DatePicker,
  args: { label: 'Date de naissance' },
} satisfies Meta<typeof DatePicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => {
    const [date, setDate] = useState<Date | undefined>(undefined);
    return <DatePicker {...args} value={date} onChange={setDate} />;
  },
};

export const AvecValeur: Story = {
  render: () => {
    const [date, setDate] = useState<Date | undefined>(new Date(2026, 5, 14));
    return (
      <DatePicker label="Rendez-vous" value={date} onChange={setDate} />
    );
  },
};
