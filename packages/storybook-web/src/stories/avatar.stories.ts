import {
  AvatarComponent,
  AvatarGroupComponent,
  type AvatarSizeVariants,
} from '@justin-croyable/design-system/components/avatar';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';

type AvatarArgs = {
  src: string;
  alt: string;
  fallback: string;
  size: AvatarSizeVariants;
  showBadge: boolean;
  badgeIcon: string;
};

const meta: Meta<AvatarArgs> = {
  title: 'Composants/Avatar',
  component: AvatarComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [AvatarGroupComponent] })],
  parameters: {
    docs: {
      description: {
        component:
          "`fallback` s'affiche quand `src` est absent ou que l'image échoue — typiquement les initiales. `app-avatar-group` empile plusieurs avatars, à l'horizontale ou à la verticale.",
      },
    },
  },
  argTypes: {
    src: { control: 'text' },
    alt: { control: 'text' },
    fallback: { control: 'text' },
    size: { control: 'inline-radio', options: ['sm', 'default', 'lg'] },
    showBadge: { control: 'boolean' },
    badgeIcon: { control: 'text' },
  },
  args: {
    src: '',
    alt: 'Théophane Girard',
    fallback: 'TG',
    size: 'default',
    showBadge: false,
    badgeIcon: '',
  },
  render: args => ({
    props: args,
    template: `
      <app-avatar
        [src]="src"
        [alt]="alt"
        [fallback]="fallback"
        [size]="size"
        [showBadge]="showBadge"
        [badgeIcon]="badgeIcon"
      />
    `,
  }),
};

export default meta;
type Story = StoryObj<AvatarArgs>;

export const Fallback: Story = {};

export const WithBadge: Story = { args: { showBadge: true } };

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="flex items-center gap-4">
        <app-avatar size="sm" fallback="SM" />
        <app-avatar size="default" fallback="MD" />
        <app-avatar size="lg" fallback="LG" />
      </div>
    `,
  }),
};

export const Group: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <app-avatar-group orientation="horizontal">
        <app-avatar fallback="TG" />
        <app-avatar fallback="ML" />
        <app-avatar fallback="JD" />
        <app-avatar fallback="+3" />
      </app-avatar-group>
    `,
  }),
};

export const GroupVertical: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <app-avatar-group orientation="vertical">
        <app-avatar fallback="TG" />
        <app-avatar fallback="ML" />
        <app-avatar fallback="JD" />
      </app-avatar-group>
    `,
  }),
};
