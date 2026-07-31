import { KbdComponent, KbdGroupComponent } from '@justin-croyable/design-system';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

type KbdArgs = { touche: string };

const meta: Meta<KbdArgs> = {
  title: 'Composants/Kbd',
  component: KbdComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [KbdGroupComponent] })],
  parameters: {
    docs: {
      description: {
        component:
          "Rend un `<kbd>` natif pour représenter une touche. `app-kbd-group` aligne plusieurs touches, pour un raccourci composé.",
      },
    },
  },
  argTypes: { touche: { control: 'text' } },
  args: { touche: '⌘' },
  render: args => ({
    props: args,
    template: `<app-kbd>{{ touche }}</app-kbd>`,
  }),
};

export default meta;
type Story = StoryObj<KbdArgs>;

export const Default: Story = {};

export const Shortcut: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <app-kbd-group>
        <app-kbd>⌘</app-kbd>
        <app-kbd>K</app-kbd>
      </app-kbd-group>
    `,
  }),
};

export const Shortcuts: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="flex flex-col gap-3 text-sm">
        <div class="flex items-center justify-between gap-8">
          <span>Palette de commandes</span>
          <app-kbd-group>
            <app-kbd>⌘</app-kbd>
            <app-kbd>K</app-kbd>
          </app-kbd-group>
        </div>
        <div class="flex items-center justify-between gap-8">
          <span>Enregistrer</span>
          <app-kbd-group>
            <app-kbd>⌘</app-kbd>
            <app-kbd>S</app-kbd>
          </app-kbd-group>
        </div>
        <div class="flex items-center justify-between gap-8">
          <span>Quitter</span>
          <app-kbd>Échap</app-kbd>
        </div>
      </div>
    `,
  }),
};
