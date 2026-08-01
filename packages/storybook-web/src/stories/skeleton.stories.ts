import { SkeletonComponent } from '@justin-croyable/design-system';
import type { Meta, StoryObj } from '@storybook/angular-vite';

type SkeletonArgs = { class: string };

const meta: Meta<SkeletonArgs> = {
  title: 'Composants/Skeleton',
  component: SkeletonComponent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          "Le squelette n'a pas de dimensions propres : c'est le consommateur qui donne la forme via `class`, pour que le placeholder épouse exactement le contenu qu'il remplace.",
      },
    },
  },
  argTypes: { class: { control: 'text' } },
  args: { class: 'h-4 w-48' },
  render: args => ({
    props: args,
    template: `<app-skeleton [class]="class" />`,
  }),
};

export default meta;
type Story = StoryObj<SkeletonArgs>;

export const Default: Story = {};

export const CardPlaceholder: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="w-80 space-y-3 rounded-xl border p-4">
        <div class="flex items-center gap-3">
          <app-skeleton class="size-10 rounded-full" />
          <div class="space-y-2">
            <app-skeleton class="h-3 w-32" />
            <app-skeleton class="h-3 w-20" />
          </div>
        </div>
        <app-skeleton class="h-24 w-full rounded-lg" />
        <app-skeleton class="h-3 w-3/4" />
      </div>
    `,
  }),
};
