import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { ButtonComponent, DialogService } from '@justin-croyable/design-system';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

@Component({
  selector: 'app-dialog-demo',
  imports: [ButtonComponent],
  template: `
    <button appButton variant="outline" (click)="open()">Ouvrir la boîte de dialogue</button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class DialogDemoComponent {
  private readonly dialog = inject(DialogService);

  readonly okDestructive = input(false);
  readonly okDisabled = input(false);
  readonly hideFooter = input(false);
  readonly closable = input(true);
  readonly maskClosable = input(true);
  readonly width = input('');

  protected open(): void {
    this.dialog.create({
      title: 'Supprimer le projet',
      description: 'Cette action est définitive. Les données associées seront perdues.',
      content: 'Le contenu accepte une chaîne, un TemplateRef ou un composant.',
      okText: this.okDestructive() ? 'Supprimer' : 'Confirmer',
      cancelText: 'Annuler',
      okDestructive: this.okDestructive(),
      okDisabled: this.okDisabled(),
      hideFooter: this.hideFooter(),
      closable: this.closable(),
      maskClosable: this.maskClosable(),
      width: this.width() || undefined,
    });
  }
}

type DialogArgs = {
  okDestructive: boolean;
  okDisabled: boolean;
  hideFooter: boolean;
  closable: boolean;
  maskClosable: boolean;
  width: string;
};

const meta: Meta<DialogArgs> = {
  title: 'Composants/Dialog',
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [DialogDemoComponent] })],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          "Boîte de dialogue modale ouverte par service : `DialogService.create()` reçoit les options — titre, description, contenu, libellés des actions — et renvoie un `DialogRef` pour la fermer et récupérer un résultat. Le contenu accepte une chaîne, un `TemplateRef` ou un composant, auquel les données passent par `injectDialogData()`. Pour un panneau latéral plutôt qu'une modale centrée, voir `app-sheet`.",
      },
    },
  },
  argTypes: {
    okDestructive: { control: 'boolean', description: 'Action principale en rouge.' },
    okDisabled: { control: 'boolean' },
    hideFooter: { control: 'boolean' },
    closable: { control: 'boolean', description: 'Croix de fermeture dans l’en-tête.' },
    maskClosable: { control: 'boolean', description: 'Un clic sur le fond ferme la modale.' },
    width: { control: 'text', description: 'Largeur CSS, ex. 32rem.' },
  },
  args: {
    okDestructive: false,
    okDisabled: false,
    hideFooter: false,
    closable: true,
    maskClosable: true,
    width: '',
  },
  render: args => ({
    props: args,
    template: `
      <app-dialog-demo
        [okDestructive]="okDestructive"
        [okDisabled]="okDisabled"
        [hideFooter]="hideFooter"
        [closable]="closable"
        [maskClosable]="maskClosable"
        [width]="width"
      />
    `,
  }),
};

export default meta;
type Story = StoryObj<DialogArgs>;

export const Default: Story = {};

export const Destructive: Story = { args: { okDestructive: true } };

export const OkDisabled: Story = { args: { okDisabled: true } };

export const WithoutFooter: Story = { args: { hideFooter: true } };

export const NotDismissible: Story = { args: { closable: false, maskClosable: false } };

export const Wide: Story = { args: { width: '40rem' } };
