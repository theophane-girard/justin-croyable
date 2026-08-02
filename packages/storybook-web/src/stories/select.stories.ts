import { SelectImports, type SelectSizeVariants } from '@justin-croyable/design-system';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';

type SelectArgs = {
  placeholder: string;
  size: SelectSizeVariants;
  multiple: boolean;
  disabled: boolean;
  maxLabelCount: number;
  value: string | string[];
  label: string;
  hint: string;
  required: boolean;
};

const meta: Meta<SelectArgs> = {
  title: 'Composants/Select',
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [...SelectImports] })],
  parameters: {
    docs: {
      description: {
        component:
          "Liste déroulante bâtie sur le CDK Overlay, pilotable au clavier (flèches, Entrée, Échap, Début/Fin). En mode `multiple`, les valeurs choisies s'affichent en badges et `maxLabelCount` limite le nombre de libellés visibles avant compactage.",
      },
    },
  },
  argTypes: {
    placeholder: { control: 'text' },
    size: { control: 'inline-radio', options: ['sm', 'default', 'lg'] },
    multiple: { control: 'boolean' },
    disabled: { control: 'boolean' },
    maxLabelCount: { control: { type: 'number', min: 1, max: 5 } },
    value: { control: false },
    label: { control: 'text', description: 'Libellé visible, lié au déclencheur.' },
    hint: { control: 'text', description: 'Texte d’aide sous le contrôle.' },
    required: { control: 'boolean', description: 'Ajoute l’astérisque et aria-required.' },
  },
  args: {
    placeholder: 'Sélectionner un rôle…',
    size: 'default',
    multiple: false,
    disabled: false,
    maxLabelCount: 1,
    value: '',
    label: '',
    hint: '',
    required: false,
  },
  render: args => ({
    props: args,
    template: `
      <div class="w-72">
        <app-select
          [placeholder]="placeholder"
          [size]="size"
          [multiple]="multiple"
          [disabled]="disabled"
          [maxLabelCount]="maxLabelCount"
          [label]="label"
          [hint]="hint"
          [required]="required"
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

export const Multiple: Story = {
  args: { multiple: true, value: ['admin', 'editor'], maxLabelCount: 3, placeholder: 'Rôles…' },
};

export const Disabled: Story = { args: { disabled: true, value: 'user' } };

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
