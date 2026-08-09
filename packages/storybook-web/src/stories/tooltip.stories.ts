import { ButtonComponent } from '@justin-croyable/design-system/components/button';
import {
  TooltipImports,
  type TooltipPositionVariants,
  type TooltipTriggers,
} from '@justin-croyable/design-system/components/tooltip';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, waitFor } from 'storybook/test';

type TooltipArgs = {
  appTooltip: string;
  position: TooltipPositionVariants;
  trigger: TooltipTriggers;
  showDelay: number;
  hideDelay: number;
  positionOffset: number;
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
    positionOffset: {
      control: { type: 'number', min: 0, max: 24 },
      description: 'Distance en px entre le déclencheur et la bulle.',
    },
  },
  args: {
    appTooltip: 'Ajouter aux favoris',
    position: 'top',
    trigger: 'hover',
    showDelay: 150,
    hideDelay: 100,
    positionOffset: 4,
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
          [positionOffset]="positionOffset"
        >
          Survolez-moi
        </button>
      </div>
    `,
  }),
};

export default meta;
type Story = StoryObj<TooltipArgs>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const declencheur = canvasElement.querySelector<HTMLElement>('button')!;

    await userEvent.hover(declencheur);

    await waitFor(() => {
      expect(document.querySelector('[data-slot="tooltip-content"]')?.textContent).toContain(
        'Ajouter aux favoris',
      );
    });

    await userEvent.unhover(declencheur);
    await waitFor(() => {
      expect(document.querySelector('[data-slot="tooltip-content"]')).toBeNull();
    });
  },
};

export const OnClick: Story = {
  args: { trigger: 'click', appTooltip: 'Copié !' },
  play: async ({ canvasElement }) => {
    const declencheur = canvasElement.querySelector<HTMLElement>('button')!;

    await userEvent.hover(declencheur);
    expect(document.querySelector('[data-slot="tooltip-content"]')).toBeNull();

    await userEvent.click(declencheur);
    await waitFor(() => {
      expect(document.querySelector('[data-slot="tooltip-content"]')?.textContent).toContain(
        'Copié !',
      );
    });
  },
};

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
