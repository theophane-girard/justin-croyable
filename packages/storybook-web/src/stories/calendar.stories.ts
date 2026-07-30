import { CalendarComponent, type CalendarMode, type CalendarValue } from '@justin-croyable/design-system';
import type { Meta, StoryObj } from '@storybook/angular';

type CalendarArgs = {
  mode: CalendarMode;
  value: CalendarValue;
  minDate: Date | null;
  maxDate: Date | null;
  disabled: boolean;
};

const meta: Meta<CalendarArgs> = {
  title: 'Composants/Calendar',
  component: CalendarComponent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          "Trois modes de sélection : `single`, `multiple` et `range`. `value` est un `model()` — un `Date` en mode simple, un tableau de `Date` sinon. `minDate`/`maxDate` bornent la navigation autant que la sélection.",
      },
    },
  },
  argTypes: {
    mode: { control: 'inline-radio', options: ['single', 'multiple', 'range'] },
    disabled: { control: 'boolean' },
    // Pas de contrôle `date` : Storybook renverrait un timestamp là où le
    // composant attend un `Date`. Les bornes sont démontrées par la story
    // `Bounded`, qui construit de vraies dates.
    value: { control: false },
    minDate: { control: false },
    maxDate: { control: false },
  },
  args: {
    mode: 'single',
    value: null,
    minDate: null,
    maxDate: null,
    disabled: false,
  },
  render: args => ({
    props: args,
    template: `
      <app-calendar
        [mode]="mode"
        [(value)]="value"
        [minDate]="minDate"
        [maxDate]="maxDate"
        [(disabled)]="disabled"
      />
    `,
  }),
};

export default meta;
type Story = StoryObj<CalendarArgs>;

export const Default: Story = {};

export const Multiple: Story = { args: { mode: 'multiple' } };

export const Range: Story = { args: { mode: 'range' } };

export const Disabled: Story = { args: { disabled: true } };

/**
 * Bornes de navigation. Les dates sont construites à l'exécution de la story
 * pour rester relatives à aujourd'hui.
 */
export const Bounded: Story = {
  render: () => {
    const today = new Date();
    const min = new Date(today.getFullYear(), today.getMonth(), 1);
    const max = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    return {
      props: { value: null, min, max },
      template: `<app-calendar [(value)]="value" [minDate]="min" [maxDate]="max" />`,
    };
  },
};
