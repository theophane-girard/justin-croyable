import { RadioGroupImports } from '@justin-croyable/design-system';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

type RadioGroupArgs = {
  value: unknown;
  disabled: boolean;
  name: string;
};

const meta: Meta<RadioGroupArgs> = {
  title: 'Composants/Radio Group',
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...RadioGroupImports] })],
  parameters: {
    docs: {
      description: {
        component:
          "Groupe de boutons radio : `app-radio-group` porte la valeur (un `model()`, donc liable en deux sens) et chaque `app-radio` sa propre valeur. Désactiver le groupe désactive tous ses éléments ; un élément peut aussi l'être individuellement.",
      },
    },
  },
  argTypes: {
    value: { control: false },
    disabled: { control: 'boolean' },
    name: { control: 'text' },
  },
  args: { value: 'mensuel', disabled: false, name: 'facturation' },
  render: args => ({
    props: args,
    template: `
      <app-radio-group [(value)]="value" [disabled]="disabled" [name]="name">
        <app-radio value="mensuel">Mensuel</app-radio>
        <app-radio value="annuel">Annuel — deux mois offerts</app-radio>
        <app-radio value="ponctuel" [disabled]="true">Ponctuel (indisponible)</app-radio>
      </app-radio-group>
    `,
  }),
};

export default meta;
type Story = StoryObj<RadioGroupArgs>;

export const Default: Story = {};

export const NoSelection: Story = { args: { value: null } };

export const DisabledGroup: Story = { args: { disabled: true } };
