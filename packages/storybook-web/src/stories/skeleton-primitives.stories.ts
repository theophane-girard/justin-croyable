import {
  SkBlockComponent,
  SkCircleComponent,
  SkLineComponent,
  SkTextComponent,
} from '@justin-croyable/design-system/components/skeleton';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';

const meta: Meta = {
  title: 'Composants/Skeleton — Primitives',
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [SkLineComponent, SkTextComponent, SkBlockComponent, SkCircleComponent],
    }),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Primitives de composition des skeletons : `sk-line`, `sk-text`, `sk-block`, `sk-circle`. Elles partagent la même animation (`animate-skeleton`, respectueuse de `prefers-reduced-motion`) et le même token de couleur (`bg-muted`). Aucune logique métier — c’est le consommateur qui donne les dimensions.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Primitives: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="flex w-96 flex-col gap-6">
        <div class="flex items-center gap-3">
          <sk-circle size="size-12" />
          <div class="flex flex-1 flex-col gap-2">
            <sk-line height="h-4" width="w-1/2" />
            <sk-line height="h-3" width="w-1/3" />
          </div>
        </div>
        <sk-text [lines]="3" />
        <sk-block height="h-32" />
      </div>
    `,
  }),
};
