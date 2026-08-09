import { CheckboxComponent } from '@justin-croyable/design-system/components/checkbox';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { expect, userEvent } from 'storybook/test';

type CheckboxArgs = {
  label: string;
  disabled: boolean;
  invalid: boolean;
};

const meta: Meta<CheckboxArgs> = {
  title: 'Composants/Checkbox',
  component: CheckboxComponent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          "Case à cocher accessible : le `<input type=\"checkbox\">` natif est conservé, le libellé passe par projection de contenu. Implémente `ControlValueAccessor`, donc utilisable directement avec les formulaires Angular.",
      },
    },
  },
  argTypes: {
    label: { control: 'text' },
    disabled: { control: 'boolean' },
    invalid: { control: 'boolean' },
  },
  args: { label: "J'accepte les conditions", disabled: false, invalid: false },
  render: args => ({
    props: args,
    template: `
      <app-checkbox [disabled]="disabled" [invalid]="invalid">{{ label }}</app-checkbox>
    `,
  }),
};

export default meta;
type Story = StoryObj<CheckboxArgs>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const boite = canvasElement.querySelector<HTMLInputElement>('input[type="checkbox"]');
    expect(boite).toBeTruthy();
    expect(boite!.checked).toBe(false);

    await userEvent.click(boite!);
    expect(boite!.checked).toBe(true);

    await userEvent.click(boite!);
    expect(boite!.checked).toBe(false);
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    const boite = canvasElement.querySelector<HTMLInputElement>('input[type="checkbox"]');
    expect(boite!.disabled).toBe(true);

    await userEvent.click(boite!, { pointerEventsCheck: 0 });
    expect(boite!.checked).toBe(false);
  },
};

export const Invalid: Story = { args: { invalid: true, label: 'Champ obligatoire' } };

export const WithoutLabel: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({ template: `<app-checkbox />` }),
};

export const Group: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="flex flex-col gap-3">
        <app-checkbox>Notifications par e-mail</app-checkbox>
        <app-checkbox>Notifications push</app-checkbox>
        <app-checkbox [disabled]="true">SMS (indisponible)</app-checkbox>
      </div>
    `,
  }),
};
