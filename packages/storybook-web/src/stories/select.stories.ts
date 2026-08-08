import {
  SelectImports,
  type SelectSizeVariants,
} from '@justin-croyable/design-system/components/select';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';

type SelectArgs = {
  placeholder: string;
  prefixIcon: string;
  size: SelectSizeVariants;
  multiple: boolean;
  disabled: boolean;
  maxLabelCount: number;
  value: string | string[];
  label: string;
  hint: string;
  required: boolean;
  withSearch: boolean;
  searchPlaceholder: string;
  emptyText: string;
};

const meta: Meta<SelectArgs> = {
  title: 'Composants/Select',
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...SelectImports] })],
  parameters: {
    docs: {
      description: {
        component:
          "Liste déroulante bâtie sur le CDK Overlay, pilotable au clavier (flèches, Entrée, Échap, Début/Fin). En mode `multiple`, les valeurs choisies s'affichent en badges et `maxLabelCount` limite le nombre de libellés visibles avant compactage. `prefixIcon` affiche une icône (ng-icon) en préfixe du déclencheur. `withSearch` ajoute un champ de recherche en tête de liste (inspiré de la combobox) pour filtrer les options par libellé, avec message `emptyText` quand aucune ne correspond. Sur mobile (< sm), la liste s'ouvre en bottom sheet ancré en bas — avec en-tête rappelant le champ, une poignée (glisser vers le haut pour agrandir, vers le bas pour fermer) et des animations d'ouverture/fermeture — au lieu du popover ancré.",
      },
    },
  },
  argTypes: {
    placeholder: { control: 'text' },
    prefixIcon: { control: 'text', description: 'Nom d’icône (ng-icon) affichée en préfixe du déclencheur.' },
    size: { control: 'inline-radio', options: ['sm', 'default', 'lg'] },
    multiple: { control: 'boolean' },
    disabled: { control: 'boolean' },
    maxLabelCount: { control: { type: 'number', min: 1, max: 5 } },
    value: { control: false },
    label: { control: 'text', description: 'Libellé visible, lié au déclencheur.' },
    hint: { control: 'text', description: 'Texte d’aide sous le contrôle.' },
    required: { control: 'boolean', description: 'Ajoute l’astérisque et aria-required.' },
    withSearch: {
      control: 'boolean',
      description: 'Ajoute un champ de recherche en haut de la liste pour filtrer les options.',
    },
    searchPlaceholder: { control: 'text', description: 'Placeholder du champ de recherche.' },
    emptyText: { control: 'text', description: 'Message affiché quand aucune option ne correspond.' },
  },
  args: {
    placeholder: 'Sélectionner un rôle…',
    prefixIcon: '',
    size: 'default',
    multiple: false,
    disabled: false,
    maxLabelCount: 1,
    value: '',
    label: '',
    hint: '',
    required: false,
    withSearch: false,
    searchPlaceholder: 'Rechercher…',
    emptyText: 'Aucun résultat.',
  },
  render: args => ({
    props: args,
    template: `
      <div class="w-72">
        <app-select
          [placeholder]="placeholder"
          [prefixIcon]="prefixIcon"
          [size]="size"
          [multiple]="multiple"
          [disabled]="disabled"
          [maxLabelCount]="maxLabelCount"
          [label]="label"
          [hint]="hint"
          [required]="required"
          [withSearch]="withSearch"
          [searchPlaceholder]="searchPlaceholder"
          [emptyText]="emptyText"
          [(value)]="value"
        >
          <app-select-item value="admin">Administrateur</app-select-item>
          <app-select-item value="editor">Éditeur</app-select-item>
          <app-select-item value="user">Utilisateur</app-select-item>
          <app-select-item value="guest" [disabled]="true">Invité (désactivé)</app-select-item>
        </app-select>
      </div>
    `,
  }),
};

export default meta;
type Story = StoryObj<SelectArgs>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const declencheur = canvasElement.querySelector<HTMLElement>('[role="combobox"]')!;
    expect(declencheur.textContent).toContain('Sélectionner un rôle…');

    await userEvent.click(declencheur);

    const liste = await waitFor(() => {
      const trouvee = document.querySelector<HTMLElement>('[role="listbox"]');
      expect(trouvee).toBeTruthy();
      return trouvee!;
    });

    await userEvent.click(within(liste).getByText('Éditeur'));

    await waitFor(() => {
      expect(declencheur.textContent).toContain('Éditeur');
      expect(document.querySelector('[role="listbox"]')).toBeNull();
    });
  },
};

export const WithLabelAndHint: Story = {
  args: {
    label: 'Rôle',
    hint: 'Détermine les permissions dans l’espace.',
    required: true,
  },
};

export const Preselected: Story = { args: { value: 'editor' } };

export const WithPrefixIcon: Story = {
  args: {
    label: 'Rôle',
    prefixIcon: 'lucideSearch',
    placeholder: 'Rechercher un rôle…',
  },
};

export const Multiple: Story = {
  args: { multiple: true, value: ['admin', 'editor'], maxLabelCount: 3, placeholder: 'Rôles…' },
};

export const Disabled: Story = { args: { disabled: true, value: 'user' } };

export const WithSearch: Story = {
  args: {
    label: 'Rôle',
    withSearch: true,
    searchPlaceholder: 'Rechercher un rôle…',
    placeholder: 'Sélectionner un rôle…',
  },
  play: async ({ canvasElement }) => {
    const declencheur = canvasElement.querySelector<HTMLElement>('[role="combobox"]')!;
    await userEvent.click(declencheur);

    const liste = await waitFor(() => {
      const trouvee = document.querySelector<HTMLElement>('[role="listbox"]');
      expect(trouvee).toBeTruthy();
      return trouvee!;
    });

    const recherche = within(liste).getByRole('searchbox');
    await userEvent.type(recherche, 'édit');

    await waitFor(() => {
      expect(within(liste).getByText('Éditeur')).toBeVisible();
      expect(within(liste).queryByText('Administrateur')).not.toBeVisible();
    });

    await userEvent.click(within(liste).getByText('Éditeur'));

    await waitFor(() => {
      expect(declencheur.textContent).toContain('Éditeur');
      expect(document.querySelector('[role="listbox"]')).toBeNull();
    });
  },
};

export const MultipleWithSearch: Story = {
  args: {
    label: 'Rôles',
    multiple: true,
    withSearch: true,
    maxLabelCount: 3,
    value: ['admin'],
    searchPlaceholder: 'Rechercher un rôle…',
    placeholder: 'Rôles…',
  },
};

export const Sizes: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    props: { sm: '', md: '', lg: '' },
    template: `
      <div class="flex w-72 flex-col gap-3">
        <app-select size="sm" placeholder="sm" [(value)]="sm">
          <app-select-item value="a">Option A</app-select-item>
          <app-select-item value="b">Option B</app-select-item>
        </app-select>
        <app-select size="default" placeholder="default" [(value)]="md">
          <app-select-item value="a">Option A</app-select-item>
          <app-select-item value="b">Option B</app-select-item>
        </app-select>
        <app-select size="lg" placeholder="lg" [(value)]="lg">
          <app-select-item value="a">Option A</app-select-item>
          <app-select-item value="b">Option B</app-select-item>
        </app-select>
      </div>
    `,
  }),
};
