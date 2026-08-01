import {
  InputDirective,
  type InputSizeVariants,
  type InputStatusVariants,
} from '@justin-croyable/design-system';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';

type InputArgs = {
  placeholder: string;
  inputSize: InputSizeVariants;
  status: InputStatusVariants | undefined;
  borderless: boolean;
  disabled: boolean;
};

const meta: Meta<InputArgs> = {
  title: 'Composants/Input',
  // Pas de `component` ici : c'est une directive, et l'extraction d'args de
  // Storybook attend un composant. La directive est fournie par `moduleMetadata`
  // et les args sont déclarés explicitement ci-dessous.
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [InputDirective] })],
  parameters: {
    docs: {
      description: {
        component:
          "C'est une directive, pas un composant : elle s'applique sur un `<input>` ou un `<textarea>` natif (`app-input`), donc le type, la validation et l'accessibilité natives restent inchangés. L'entrée de taille s'appelle `inputSize` pour ne pas masquer l'attribut HTML `size`.",
      },
    },
  },
  argTypes: {
    placeholder: { control: 'text' },
    inputSize: { control: 'inline-radio', options: ['sm', 'default', 'lg'] },
    status: { control: 'inline-radio', options: [undefined, 'error', 'warning', 'success'] },
    borderless: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  args: {
    placeholder: 'jean.dupont@exemple.fr',
    inputSize: 'default',
    status: undefined,
    borderless: false,
    disabled: false,
  },
  render: args => ({
    props: args,
    template: `
      <div class="w-80">
        <input
          app-input
          type="email"
          [placeholder]="placeholder"
          [inputSize]="inputSize"
          [status]="status"
          [borderless]="borderless"
          [disabled]="disabled"
        />
      </div>
    `,
  }),
};

export default meta;
type Story = StoryObj<InputArgs>;

export const Default: Story = {};

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="flex w-80 flex-col gap-3">
        <input app-input inputSize="sm" placeholder="sm" />
        <input app-input inputSize="default" placeholder="default" />
        <input app-input inputSize="lg" placeholder="lg" />
      </div>
    `,
  }),
};

export const Statuses: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="flex w-80 flex-col gap-3">
        <input app-input status="error" placeholder="error" />
        <input app-input status="warning" placeholder="warning" />
        <input app-input status="success" placeholder="success" />
      </div>
    `,
  }),
};

export const Disabled: Story = { args: { disabled: true, placeholder: 'Non modifiable' } };

export const Textarea: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="w-80">
        <textarea app-input rows="4" placeholder="Votre message…"></textarea>
      </div>
    `,
  }),
};
