import {
  DatePickerComponent,
  type ButtonVariant,
  type DatePickerSizeVariants,
} from '@justin-croyable/design-system';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, waitFor } from 'storybook/test';

type DatePickerArgs = {
  placeholder: string;
  format: string;
  type: ButtonVariant;
  size: DatePickerSizeVariants;
  disabled: boolean;
  value: Date | null;
};

const meta: Meta<DatePickerArgs> = {
  title: 'Composants/Date Picker',
  component: DatePickerComponent,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Déclencheur bouton + calendrier dans un popover. `type` reprend les variantes du bouton, `format` contrôle le rendu de la date sélectionnée.',
      },
    },
  },
  argTypes: {
    placeholder: { control: 'text' },
    format: { control: 'text' },
    type: {
      control: 'select',
      options: ['default', 'outline', 'ghost', 'secondary', 'destructive', 'link'],
    },
    size: { control: 'inline-radio', options: ['xs', 'sm', 'default', 'lg'] },
    disabled: { control: 'boolean' },
    value: { control: false },
  },
  args: {
    placeholder: 'Choisir une date',
    format: 'd MMMM yyyy',
    type: 'outline',
    size: 'default',
    disabled: false,
    value: null,
  },
  render: args => ({
    props: args,
    template: `
      <div class="flex min-h-96 justify-center">
        <app-date-picker
          [placeholder]="placeholder"
          [format]="format"
          [type]="type"
          [size]="size"
          [disabled]="disabled"
          [(value)]="value"
        />
      </div>
    `,
  }),
};

export default meta;
type Story = StoryObj<DatePickerArgs>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const declencheur = canvasElement.querySelector<HTMLElement>('button')!;
    expect(declencheur.textContent).toContain('Choisir une date');

    await userEvent.click(declencheur);

    // Le calendrier est rendu dans une couche du CDK, donc hors du canevas.
    const calendrier = await waitFor(() => {
      const trouve = document.querySelector<HTMLElement>('app-calendar');
      expect(trouve).toBeTruthy();
      return trouve!;
    });

    const jours = [
      ...calendrier.querySelectorAll<HTMLButtonElement>('[role="gridcell"] button'),
    ].filter(jour => !jour.disabled);
    await userEvent.click(jours[10]);

    // Choisir une date la formate dans le déclencheur et referme le calendrier.
    await waitFor(() => {
      expect(declencheur.textContent).not.toContain('Choisir une date');
      expect(document.querySelector('app-calendar')).toBeNull();
    });
  },
};

export const Preselected: Story = {
  render: args => ({
    props: { ...args, value: new Date() },
    template: `
      <div class="flex min-h-96 justify-center">
        <app-date-picker [format]="format" [type]="type" [size]="size" [(value)]="value" />
      </div>
    `,
  }),
};

export const Disabled: Story = { args: { disabled: true } };

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    props: { xs: null, sm: null, md: null, lg: null },
    template: `
      <div class="flex min-h-96 flex-wrap items-start gap-3">
        <app-date-picker size="xs" placeholder="xs" [(value)]="xs" />
        <app-date-picker size="sm" placeholder="sm" [(value)]="sm" />
        <app-date-picker size="default" placeholder="default" [(value)]="md" />
        <app-date-picker size="lg" placeholder="lg" [(value)]="lg" />
      </div>
    `,
  }),
};
