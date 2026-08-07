import { ButtonComponent } from '@justin-croyable/design-system/components/button';
import {
  MenuImports,
  type MenuPlacement,
  type MenuTrigger,
} from '@justin-croyable/design-system/components/menu';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, waitFor } from 'storybook/test';

type MenuArgs = {
  trigger: MenuTrigger;
  placement: MenuPlacement;
  hoverDelay: number;
  disabled: boolean;
};

const meta: Meta<MenuArgs> = {
  title: 'Composants/Menu',
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...MenuImports, ButtonComponent] })],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          "Menu déroulant composé de directives : `app-menu` sur le déclencheur avec `menuTriggerFor` pointant un `ng-template`, `app-menu-content` sur le panneau, `app-menu-item` sur chaque entrée, plus `app-menu-label` et `app-menu-shortcut`. `app-context-menu` reprend le même contenu sur le clic droit.",
      },
    },
  },
  argTypes: {
    trigger: { control: 'inline-radio', options: ['click', 'hover'] },
    placement: {
      control: 'select',
      options: ['bottomLeft', 'bottomRight', 'topLeft', 'topRight', 'leftTop', 'rightTop'],
    },
    hoverDelay: { control: { type: 'number', min: 0, max: 600, step: 50 } },
    disabled: { control: 'boolean' },
  },
  args: { trigger: 'click', placement: 'bottomLeft', hoverDelay: 100, disabled: false },
  render: args => ({
    props: args,
    template: `
      <div class="flex min-h-72 items-start justify-center">
        <ng-template #menu>
          <div app-menu-content class="w-56">
            <div app-menu-label>Mon compte</div>
            <button app-menu-item>
              Profil
              <span app-menu-shortcut>⇧⌘P</span>
            </button>
            <button app-menu-item>
              Paramètres
              <span app-menu-shortcut>⌘,</span>
            </button>
            <button app-menu-item [disabled]="true">Équipe (indisponible)</button>
            <button app-menu-item variant="destructive">Se déconnecter</button>
          </div>
        </ng-template>

        <button
          appButton
          variant="outline"
          app-menu
          [menuTriggerFor]="menu"
          [trigger]="trigger"
          [placement]="placement"
          [hoverDelay]="hoverDelay"
          [disabled]="disabled"
        >
          Ouvrir le menu
        </button>
      </div>
    `,
  }),
};

export default meta;
type Story = StoryObj<MenuArgs>;

async function attendreMenu(): Promise<HTMLElement> {
  return waitFor(() => {
    const menu = document.querySelector<HTMLElement>('[app-menu-content]');
    expect(menu).toBeTruthy();
    return menu!;
  });
}

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const declencheur = canvasElement.querySelector<HTMLElement>('[app-menu]')!;

    await userEvent.click(declencheur);
    const menu = await attendreMenu();

    const entrees = [...menu.querySelectorAll<HTMLButtonElement>('[app-menu-item]')];
    expect(entrees.map(entree => entree.textContent?.trim().split(/\s+/)[0])).toEqual([
      'Profil',
      'Paramètres',
      'Équipe',
      'Se',
    ]);
    expect(entrees[2].getAttribute('aria-disabled')).toBe('');
    expect(entrees[2].getAttribute('data-disabled')).toBe('');

    await userEvent.click(entrees[0]);
    await waitFor(() => {
      expect(document.querySelector('[app-menu-content]')).toBeNull();
    });
  },
};

export const OnHover: Story = {
  args: { trigger: 'hover' },
  play: async ({ canvasElement }) => {
    const declencheur = canvasElement.querySelector<HTMLElement>('[app-menu]')!;

    await userEvent.hover(declencheur);
    const menu = await attendreMenu();
    expect(menu.textContent).toContain('Mon compte');

    await userEvent.unhover(declencheur);
    await waitFor(() => {
      expect(document.querySelector('[app-menu-content]')).toBeNull();
    });
  },
};

export const BottomRight: Story = { args: { placement: 'bottomRight' } };

export const Disabled: Story = { args: { disabled: true } };

export const ContextMenu: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <ng-template #menu>
        <div app-menu-content class="w-48">
          <div app-menu-label>Actions</div>
          <button app-menu-item>Copier</button>
          <button app-menu-item>Dupliquer</button>
          <button app-menu-item variant="destructive">Supprimer</button>
        </div>
      </ng-template>

      <div
        app-context-menu
        [contextMenuTriggerFor]="menu"
        class="flex min-h-56 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground"
      >
        Clic droit dans cette zone
      </div>
    `,
  }),
};
