import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import {
  ButtonComponent,
  DialogService,
  type DialogConfirmTone,
} from '@justin-croyable/design-system';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

@Component({
  selector: 'app-dialog-confirm-demo',
  imports: [ButtonComponent],
  template: `
    <button appButton variant="outline" (click)="open()">Confirmer une action</button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class DialogConfirmDemoComponent {
  private readonly dialog = inject(DialogService);

  readonly action = input('supprimer');
  readonly subject = input('le projet');
  readonly desc = input('');
  readonly tone = input<DialogConfirmTone>('danger');

  protected open(): void {
    this.dialog.confirm({
      action: this.action(),
      subject: this.subject(),
      desc: this.desc() || undefined,
      tone: this.tone(),
    });
  }
}

@Component({
  selector: 'app-dialog-info-demo',
  imports: [ButtonComponent],
  template: `
    <button appButton variant="outline" (click)="open()">Afficher une information</button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class DialogInfoDemoComponent {
  private readonly dialog = inject(DialogService);

  readonly action = input('import terminé');
  readonly message = input('428 lignes ont été ajoutées au catalogue.');
  readonly desc = input('');

  protected open(): void {
    this.dialog.info({
      action: this.action(),
      message: this.message(),
      desc: this.desc() || undefined,
    });
  }
}

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
  decorators: [
    moduleMetadata({
      imports: [DialogDemoComponent, DialogConfirmDemoComponent, DialogInfoDemoComponent],
    }),
  ],
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

/**
 * `confirm()` compose le titre et le message à partir du verbe et de son
 * complément, via les traductions du DS. Le sélecteur « Langue » de la toolbar
 * change les libellés — en allemand, l'ordre des mots du titre diffère.
 */
export const Confirm: StoryObj = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `<app-dialog-confirm-demo action="supprimer" subject="le projet" />`,
  }),
};

export const ConfirmPrimary: StoryObj = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `<app-dialog-confirm-demo action="publier" subject="la version 2.4" tone="primary" />`,
  }),
};

export const ConfirmWithDesc: StoryObj = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <app-dialog-confirm-demo
        action="archiver"
        subject="l'espace de travail"
        desc="Les membres perdront l'accès immédiatement."
      />
    `,
  }),
};

/** `info()` n'affiche qu'un bouton de fermeture, en variante secondary. */
export const Info: StoryObj = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `<app-dialog-info-demo />`,
  }),
};

export const InfoWithDesc: StoryObj = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <app-dialog-info-demo
        action="mise à jour disponible"
        message="La version 2.5 corrige 14 anomalies."
        desc="Le déploiement prendra environ deux minutes."
      />
    `,
  }),
};
