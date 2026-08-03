import {
  SegmentComponent,
  type SegmentItem,
  type SegmentSize,
  type SegmentVariant,
} from '@justin-croyable/design-system';
import { provideIcons } from '@ng-icons/core';
import {
  phosphorChartBar,
  phosphorFileText,
  phosphorGearSix,
  phosphorSquaresFour,
} from '@ng-icons/phosphor-icons/regular';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, waitFor } from 'storybook/test';

type SegmentArgs = {
  items: SegmentItem[];
  variant: SegmentVariant;
  size: SegmentSize;
  disabled: boolean;
  defaultValue: string;
};

const sections: SegmentItem[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'reports', label: 'Reports' },
  { value: 'settings', label: 'Settings' },
];

const meta: Meta<SegmentArgs> = {
  title: 'Composants/Segment',
  component: SegmentComponent,
  tags: ['autodocs'],
  decorators: [
    applicationConfig({
      providers: [
        provideIcons({
          phosphorSquaresFour,
          phosphorChartBar,
          phosphorFileText,
          phosphorGearSix,
        }),
      ],
    }),
  ],
  parameters: {
    docs: {
      description: {
        component:
          "Contrôle segmenté à sélection unique piloté par l'entrée `items`. Reprend le visuel du composant Tabs de zard/ui (piste `muted`, segment actif surélevé) avec un indicateur qui glisse d'un segment à l'autre lors du changement de valeur. Le variant `accent` colore le segment actif avec la couleur primaire.",
      },
    },
  },
  argTypes: {
    items: { control: 'object' },
    variant: { control: 'inline-radio', options: ['default', 'accent'] },
    size: { control: 'inline-radio', options: ['sm', 'default', 'lg'] },
    disabled: { control: 'boolean' },
    defaultValue: { control: false },
  },
  args: {
    items: sections,
    variant: 'default',
    size: 'default',
    disabled: false,
    defaultValue: 'overview',
  },
  render: args => ({
    props: args,
    template: `
      <app-segment
        [items]="items"
        [variant]="variant"
        [size]="size"
        [disabled]="disabled"
        [defaultValue]="defaultValue"
      />
    `,
  }),
};

export default meta;
type Story = StoryObj<SegmentArgs>;

const etats = (canvasElement: HTMLElement): (string | null)[] =>
  [...canvasElement.querySelectorAll('[data-slot="segment-item"]')].map(item =>
    item.getAttribute('aria-checked'),
  );

export const Default: Story = {
  play: async ({ canvasElement }) => {
    expect(etats(canvasElement)).toEqual(['true', 'false', 'false', 'false']);

    const items = canvasElement.querySelectorAll<HTMLElement>('[data-slot="segment-item"]');
    await userEvent.click(items[2]);

    await waitFor(() => {
      expect(etats(canvasElement)).toEqual(['false', 'false', 'true', 'false']);
    });
  },
};

export const Accent: Story = { args: { variant: 'accent' } };

export const WithIcons: Story = {
  args: {
    items: [
      { value: 'overview', label: 'Overview', icon: 'phosphorSquaresFour' },
      { value: 'analytics', label: 'Analytics', icon: 'phosphorChartBar' },
      { value: 'reports', label: 'Reports', icon: 'phosphorFileText' },
      { value: 'settings', label: 'Settings', icon: 'phosphorGearSix' },
    ],
  },
};

export const Small: Story = { args: { size: 'sm' } };

export const Large: Story = { args: { size: 'lg' } };

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    const items = [
      ...canvasElement.querySelectorAll<HTMLButtonElement>('[data-slot="segment-item"]'),
    ];
    expect(items.every(item => item.disabled)).toBe(true);

    await userEvent.click(items[1], { pointerEventsCheck: 0 });
    expect(etats(canvasElement)).toEqual(['true', 'false', 'false', 'false']);
  },
};

export const ItemDisabled: Story = {
  args: {
    items: [
      { value: 'day', label: 'Jour' },
      { value: 'week', label: 'Semaine' },
      { value: 'month', label: 'Mois', disabled: true },
    ],
    defaultValue: 'day',
  },
};
