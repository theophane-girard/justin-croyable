import { TabComponent, TabGroupComponent } from '@justin-croyable/design-system/components/tabs';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, waitFor } from 'storybook/test';

type TabsArgs = {
  tabsPosition: 'top' | 'bottom' | 'left' | 'right';
  activePosition: 'top' | 'bottom' | 'left' | 'right';
  alignTabs: 'start' | 'center' | 'end';
  showNav: boolean;
  showArrow: boolean;
};

const meta: Meta<TabsArgs> = {
  title: 'Composants/Tabs',
  component: TabGroupComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [TabComponent, TabGroupComponent] })],
  parameters: {
    docs: {
      description: {
        component:
          "Chaque `app-tab` déclare son libellé et projette son contenu ; le groupe se charge de la navigation, du défilement (flèches quand les onglets débordent) et des rôles ARIA. `activePosition` contrôle le côté où se place le trait d'onglet actif, indépendamment de `tabsPosition`.",
      },
    },
  },
  argTypes: {
    tabsPosition: { control: 'inline-radio', options: ['top', 'bottom', 'left', 'right'] },
    activePosition: { control: 'inline-radio', options: ['top', 'bottom', 'left', 'right'] },
    alignTabs: { control: 'inline-radio', options: ['start', 'center', 'end'] },
    showNav: { control: 'boolean' },
    showArrow: { control: 'boolean' },
  },
  args: {
    tabsPosition: 'top',
    activePosition: 'bottom',
    alignTabs: 'start',
    showNav: true,
    showArrow: true,
  },
  render: args => ({
    props: args,
    template: `
      <div class="w-[36rem]">
        <app-tab-group
          [tabsPosition]="tabsPosition"
          [activePosition]="activePosition"
          [alignTabs]="alignTabs"
          [showNav]="showNav"
          [showArrow]="showArrow"
        >
          <app-tab label="Compte" slug="compte">
            <p class="text-sm text-muted-foreground">
              Nom, adresse e-mail et préférences de langue.
            </p>
          </app-tab>
          <app-tab label="Mot de passe" slug="mot-de-passe">
            <p class="text-sm text-muted-foreground">
              Changez votre mot de passe et activez la double authentification.
            </p>
          </app-tab>
          <app-tab label="Facturation" slug="facturation">
            <p class="text-sm text-muted-foreground">Moyen de paiement et historique des factures.</p>
          </app-tab>
        </app-tab-group>
      </div>
    `,
  }),
};

export default meta;
type Story = StoryObj<TabsArgs>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const onglets = await waitFor(() => {
      const trouves = canvasElement.querySelectorAll<HTMLElement>('[role="tab"]');
      expect(trouves.length).toBe(3);
      return trouves;
    });
    expect(onglets[0].getAttribute('aria-selected')).toBe('true');

    await userEvent.click(onglets[1]);

    await waitFor(() => {
      expect(onglets[1].getAttribute('aria-selected')).toBe('true');
      expect(onglets[0].getAttribute('aria-selected')).toBe('false');
    });

    const panneaux = [...canvasElement.querySelectorAll('[role="tabpanel"]')];
    expect(panneaux.some(panneau => panneau.textContent?.includes('double authentification'))).toBe(
      true,
    );
  },
};

export const BottomTabs: Story = { args: { tabsPosition: 'bottom', activePosition: 'top' } };

export const VerticalTabs: Story = { args: { tabsPosition: 'left', activePosition: 'right' } };

export const Centered: Story = { args: { alignTabs: 'center' } };

export const Scrollable: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="w-72">
        <app-tab-group>
          @for (index of [1, 2, 3, 4, 5, 6, 7, 8]; track index) {
            <app-tab [label]="'Onglet ' + index">
              <p class="text-sm text-muted-foreground">Contenu de l'onglet {{ index }}.</p>
            </app-tab>
          }
        </app-tab-group>
      </div>
    `,
  }),
};
