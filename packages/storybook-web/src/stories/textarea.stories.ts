import { TextareaComponent } from '@justin-croyable/design-system';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent } from 'storybook/test';

type TextareaArgs = {
  placeholder: string;
  rows: number;
  value: string;
  disabled: boolean;
};

const meta: Meta<TextareaArgs> = {
  title: 'Composants/Textarea',
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [TextareaComponent] })],
  parameters: {
    docs: {
      description: {
        component:
          "S'applique sur un `<textarea>` natif (`app-textarea`) : les attributs HTML habituels — `rows`, `placeholder`, `maxlength`, `disabled` — restent disponibles. `value` est un `model()`, donc liable en deux sens.",
      },
    },
  },
  argTypes: {
    placeholder: { control: 'text' },
    rows: { control: { type: 'number', min: 2, max: 12 } },
    value: { control: 'text' },
    disabled: { control: 'boolean' },
  },
  args: { placeholder: 'Votre message…', rows: 4, value: '', disabled: false },
  render: args => ({
    props: args,
    template: `
      <div class="w-96">
        <textarea
          app-textarea
          [placeholder]="placeholder"
          [rows]="rows"
          [(value)]="value"
          [disabled]="disabled"
        ></textarea>
      </div>
    `,
  }),
};

export default meta;
type Story = StoryObj<TextareaArgs>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const zone = canvasElement.querySelector<HTMLTextAreaElement>('textarea')!;
    expect(zone.rows).toBe(4);

    await userEvent.type(zone, 'Première ligne');
    expect(zone.value).toBe('Première ligne');
  },
};

export const Filled: Story = {
  args: { value: 'Le composant conserve la valeur saisie via son model().' },
};

export const Disabled: Story = { args: { disabled: true, value: 'Non modifiable' } };

export const Tall: Story = { args: { rows: 10 } };

export const WithLabel: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    props: { value: '' },
    template: `
      <div class="w-96 space-y-2">
        <label for="message" class="text-sm font-medium">Message</label>
        <textarea id="message" app-textarea rows="4" placeholder="Décrivez votre demande…" [(value)]="value"></textarea>
        <p class="text-xs text-muted-foreground">{{ value.length }} caractère(s)</p>
      </div>
    `,
  }),
};
