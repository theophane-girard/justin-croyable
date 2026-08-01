import { RadioGroupImports } from '@justin-croyable/design-system';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, waitFor } from 'storybook/test';

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

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const boutons = [...canvasElement.querySelectorAll<HTMLElement>('[role="radio"]')];
    expect(boutons.length).toBe(3);
    expect(boutons.map(bouton => bouton.getAttribute('aria-checked'))).toEqual([
      'true',
      'false',
      'false',
    ]);

    await userEvent.click(boutons[1]);

    await waitFor(() => {
      expect(boutons.map(bouton => bouton.getAttribute('aria-checked'))).toEqual([
        'false',
        'true',
        'false',
      ]);
    });
  },
};

export const NoSelection: Story = {
  args: { value: null },
  play: async ({ canvasElement }) => {
    const boutons = [...canvasElement.querySelectorAll<HTMLElement>('[role="radio"]')];
    expect(boutons.every(bouton => bouton.getAttribute('aria-checked') === 'false')).toBe(true);

    await userEvent.click(boutons[2], { pointerEventsCheck: 0 });
    expect(boutons[2].getAttribute('aria-checked')).toBe('false');
  },
};

export const DisabledGroup: Story = {
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    const boutons = [...canvasElement.querySelectorAll<HTMLButtonElement>('[role="radio"]')];
    expect(boutons.every(bouton => bouton.disabled)).toBe(true);

    await userEvent.click(boutons[1], { pointerEventsCheck: 0 });
    expect(boutons[1].getAttribute('aria-checked')).toBe('false');
  },
};
