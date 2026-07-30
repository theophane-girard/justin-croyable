import {
  ButtonComponent,
  TooltipImports,
  type TooltipPositionVariants,
  type TooltipTriggers,
} from '@justin-croyable/design-system';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

type TooltipArgs = {
  appTooltip: string;
  position: TooltipPositionVariants;
  trigger: TooltipTriggers;
  showDelay: number;
  hideDelay: number;
};

const meta: Meta<TooltipArgs> = {
  title: 'Composants/Tooltip',
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...TooltipImports, ButtonComponent] })],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          "La directive s'applique sur n'importe quel élément et son contenu se passe directement à l'attribut (`[appTooltip]=\"'texte'\"`), une chaîne ou un `TemplateRef`. Les délais d'ouverture/fermeture évitent le clignotement au survol d'une rangée de boutons.",
      },
    },
  },
  argTypes: {
    appTooltip: { control: 'text', name: 'contenu' },
    position: { control: 'inline-radio', options: ['top', 'bottom', 'left', 'right'] },
    trigger: { control: 'inline-radio', options: ['hover', 'click'] },
    showDelay: { control: { type: 'number', min: 0, max: 1000, step: 50 } },
    hideDelay: { control: { type: 'number', min: 0, max: 1000, step: 50 } },
  },
  args: {
    appTooltip: 'Ajouter aux favoris',
    position: 'top',
    trigger: 'hover',
    showDelay: 150,
    hideDelay: 100,
  },
  render: args => ({
    props: args,
    template: `
      <div class="flex min-h-40 items-center justify-center">
        <button
          appButton
          variant="outline"
          [appTooltip]="appTooltip"
          [position]="position"
          [trigger]="trigger"
          [showDelay]="showDelay"
          [hideDelay]="hideDelay"
        >
          Survolez-moi
        </button>
      </div>
    `,
  }),
};

export default meta;
type Story = StoryObj<TooltipArgs>;

export const Default: Story = {};

export const OnClick: Story = { args: { trigger: 'click', appTooltip: 'Copié !' } };

export const NoDelay: Story = { args: { showDelay: 0, hideDelay: 0 } };

export const Positions: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="flex min-h-48 flex-wrap items-center justify-center gap-4">
        @for (position of ['top', 'bottom', 'left', 'right']; track position) {
          <button appButton variant="outline" [appTooltip]="'Position ' + position" [position]="position">
            {{ position }}
          </button>
        }
      </div>
    `,
  }),
};
