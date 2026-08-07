import {
  CalendarComponent,
  type CalendarMode,
  type CalendarValue,
} from '@justin-croyable/design-system/components/calendar';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, waitFor } from 'storybook/test';

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

const joursSelectionnes = (canvasElement: HTMLElement): string[] =>
  [...canvasElement.querySelectorAll('[role="gridcell"] button[aria-selected="true"]')].map(
    jour => jour.textContent?.trim() ?? '',
  );

function joursActivables(canvasElement: HTMLElement): HTMLButtonElement[] {
  return [
    ...canvasElement.querySelectorAll<HTMLButtonElement>('[role="gridcell"] button'),
  ].filter(jour => !jour.disabled);
}

export const Default: Story = {
  play: async ({ canvasElement }) => {
    expect(joursSelectionnes(canvasElement)).toEqual([]);

    const jours = joursActivables(canvasElement);
    await userEvent.click(jours[10]);
    await waitFor(() => {
      expect(joursSelectionnes(canvasElement)).toEqual([jours[10].textContent?.trim()]);
    });

    await userEvent.click(jours[15]);
    await waitFor(() => {
      expect(joursSelectionnes(canvasElement)).toEqual([jours[15].textContent?.trim()]);
    });
  },
};

export const Multiple: Story = {
  args: { mode: 'multiple' },
  play: async ({ canvasElement }) => {
    const jours = joursActivables(canvasElement);

    await userEvent.click(jours[10]);
    await userEvent.click(jours[15]);

    await waitFor(() => {
      expect(joursSelectionnes(canvasElement).length).toBe(2);
    });
  },
};

export const Range: Story = { args: { mode: 'range' } };

export const Disabled: Story = { args: { disabled: true } };

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
