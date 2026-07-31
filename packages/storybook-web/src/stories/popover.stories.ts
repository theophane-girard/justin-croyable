import {
  ButtonComponent,
  PopoverComponent,
  PopoverDirective,
  type PopoverPlacement,
  type PopoverTrigger,
} from '@justin-croyable/design-system';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

type PopoverArgs = {
  placement: PopoverPlacement;
  trigger: PopoverTrigger;
  overlayClickable: boolean;
};

const meta: Meta<PopoverArgs> = {
  title: 'Composants/Popover',
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({ imports: [PopoverDirective, PopoverComponent, ButtonComponent] }),
  ],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          "`appPopover` est une directive posée sur le déclencheur ; le contenu est un `ng-template` passé via `content`, projeté dans un overlay CDK. `app-popover` n'est que la surface stylée du panneau — utile pour garder le style du DS sur un contenu libre.",
      },
    },
  },
  argTypes: {
    placement: { control: 'inline-radio', options: ['top', 'bottom', 'left', 'right'] },
    trigger: { control: 'inline-radio', options: ['click', 'hover'] },
    overlayClickable: {
      control: 'boolean',
      description: 'Un clic en dehors ferme le popover.',
    },
  },
  args: { placement: 'bottom', trigger: 'click', overlayClickable: true },
  render: args => ({
    props: args,
    template: `
      <div class="flex min-h-64 items-center justify-center">
        <ng-template #panel>
          <app-popover class="w-64 p-4">
            <p class="text-sm font-medium">Dimensions</p>
            <p class="mt-1 text-sm text-muted-foreground">
              Réglez la largeur et la hauteur du calque sélectionné.
            </p>
          </app-popover>
        </ng-template>

        <button
          appButton
          variant="outline"
          appPopover
          [content]="panel"
          [placement]="placement"
          [trigger]="trigger"
          [overlayClickable]="overlayClickable"
        >
          Ouvrir le popover
        </button>
      </div>
    `,
  }),
};

export default meta;
type Story = StoryObj<PopoverArgs>;

export const Default: Story = {};

export const OnHover: Story = { args: { trigger: 'hover' } };

export const Placements: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <ng-template #panel>
        <app-popover class="p-3">
          <p class="text-sm">Contenu du popover</p>
        </app-popover>
      </ng-template>

      <div class="flex min-h-72 flex-wrap items-center justify-center gap-3">
        @for (placement of ['top', 'bottom', 'left', 'right']; track placement) {
          <button appButton variant="outline" appPopover [content]="panel" [placement]="placement">
            {{ placement }}
          </button>
        }
      </div>
    `,
  }),
};
