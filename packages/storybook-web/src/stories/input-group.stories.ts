import {
  InputDirective,
  InputGroupComponent,
  type InputSizeVariants,
} from '@justin-croyable/design-system';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent } from 'storybook/test';

type InputGroupArgs = {
  label: string;
  hint: string;
  addonBefore: string;
  addonAfter: string;
  addonAlign: 'inline' | 'block';
  size: InputSizeVariants;
  required: boolean;
  disabled: boolean;
  loading: boolean;
};

const meta: Meta<InputGroupArgs> = {
  title: 'Composants/Input Group',
  component: InputGroupComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [InputDirective] })],
  parameters: {
    docs: {
      description: {
        component:
          "Habille un champ avec libellé, aide, addons et état de chargement. Le champ doit être un enfant direct portant `app-input` : c'est le sélecteur de projection utilisé par le composant. L'entrée `field` permet de brancher un champ de formulaire signal, auquel cas le message d'erreur est déduit des validateurs.",
      },
    },
  },
  argTypes: {
    label: { control: 'text' },
    hint: { control: 'text' },
    addonBefore: { control: 'text' },
    addonAfter: { control: 'text' },
    addonAlign: { control: 'inline-radio', options: ['inline', 'block'] },
    size: { control: 'inline-radio', options: ['sm', 'default', 'lg'] },
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
    loading: { control: 'boolean' },
  },
  args: {
    label: 'Adresse e-mail',
    hint: 'Nous ne partagerons jamais votre adresse.',
    addonBefore: '',
    addonAfter: '',
    addonAlign: 'inline',
    size: 'default',
    required: false,
    disabled: false,
    loading: false,
  },
  render: args => ({
    props: args,
    template: `
      <div class="w-96">
        <app-input-group
          [label]="label"
          [hint]="hint"
          [addonBefore]="addonBefore"
          [addonAfter]="addonAfter"
          [addonAlign]="addonAlign"
          [size]="size"
          [required]="required"
          [disabled]="disabled"
          [loading]="loading"
        >
          <input app-input type="email" placeholder="jean.dupont@exemple.fr" [disabled]="disabled" />
        </app-input-group>
      </div>
    `,
  }),
};

export default meta;
type Story = StoryObj<InputGroupArgs>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const champ = canvasElement.querySelector<HTMLInputElement>('input')!;
    const libelle = canvasElement.querySelector('label')!;

    expect(libelle.getAttribute('for')).toBe(champ.id);
    expect(canvasElement.textContent).toContain('Nous ne partagerons jamais votre adresse.');

    await userEvent.type(champ, 'jean@exemple.fr');
    expect(champ.value).toBe('jean@exemple.fr');
  },
};

export const Required: Story = {
  args: { required: true },
  play: async ({ canvasElement }) => {
    expect(canvasElement.querySelector('label')?.textContent).toContain('*');
    expect(canvasElement.querySelector('input')?.getAttribute('aria-required')).toBe('true');
  },
};

export const WithAddons: Story = {
  args: { label: 'Site web', addonBefore: 'https://', addonAfter: '.fr', hint: '' },
};

export const Loading: Story = { args: { loading: true, hint: 'Vérification en cours…' } };

export const Disabled: Story = { args: { disabled: true } };
