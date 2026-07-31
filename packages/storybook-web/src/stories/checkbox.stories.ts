import { CheckboxComponent } from '@justin-croyable/design-system';
import type { Meta, StoryObj } from '@storybook/angular';

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

export const Default: Story = {};

export const Disabled: Story = { args: { disabled: true } };

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
