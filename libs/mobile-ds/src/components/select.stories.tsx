import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { Select, MultiSelect, type SelectOption } from './select';

const fruits: SelectOption[] = [
  { label: 'Pomme', value: 'pomme' },
  { label: 'Banane', value: 'banane' },
  { label: 'Cerise', value: 'cerise' },
  { label: 'Fraise', value: 'fraise' },
  { label: 'Mangue', value: 'mangue' },
];

const meta = {
  title: 'Composants/Select',
  component: Select,
  args: { options: fruits, label: 'Fruit', placeholder: 'Choisir un fruit' },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => {
    const [value, setValue] = useState<string | undefined>(undefined);
    return (
      <Select
        {...args}
        value={value}
        onValueChange={setValue}
        sheetTitle="Choisir un fruit"
      />
    );
  },
};

export const Multiple: StoryObj<typeof MultiSelect> = {
  render: () => {
    const [values, setValues] = useState<string[]>(['banane']);
    return (
      <MultiSelect
        options={fruits}
        values={values}
        onValuesChange={setValues}
        label="Fruits"
        placeholder="Choisir des fruits"
        sheetTitle="Choisir des fruits"
      />
    );
  },
};
