import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import {
  ButtonComponent,
  SheetService,
  type SheetVariants,
} from '@justin-croyable/design-system';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

type Side = NonNullable<SheetVariants['side']>;
type Size = NonNullable<SheetVariants['size']>;

@Component({
  selector: 'app-sheet-demo',
  imports: [ButtonComponent],
  template: `
    <button appButton variant="outline" (click)="open()">Ouvrir le panneau</button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SheetDemoComponent {
  private readonly sheet = inject(SheetService);

  readonly side = input<Side>('left');
  readonly size = input<Size>('default');
  readonly hideFooter = input(false);
  readonly closable = input(true);
  readonly maskClosable = input(true);
  readonly okDestructive = input(false);

  protected open(): void {
    this.sheet.create({
      title: 'Filtres',
      description: 'Affinez la liste des résultats.',
      content: 'Le contenu accepte une chaîne, un TemplateRef ou un composant.',
      side: this.side(),
      size: this.size(),
      hideFooter: this.hideFooter(),
      closable: this.closable(),
      maskClosable: this.maskClosable(),
      okDestructive: this.okDestructive(),
      okText: 'Appliquer',
      cancelText: 'Annuler',
    });
  }
}

type SheetArgs = {
  side: Side;
  size: Size;
  hideFooter: boolean;
  closable: boolean;
  maskClosable: boolean;
  okDestructive: boolean;
};

const meta: Meta<SheetArgs> = {
  title: 'Composants/Sheet',
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [SheetDemoComponent] })],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          "Panneau latéral ouvert par service : `SheetService.create()` reçoit les options — côté, taille, titre, contenu, libellés des actions — et renvoie un `SheetRef` pour fermer le panneau et récupérer un résultat. Le contenu accepte une chaîne, un `TemplateRef` ou un composant, auquel les données passent par le jeton `SHEET_DATA`.",
      },
    },
  },
  argTypes: {
    side: { control: 'inline-radio', options: ['left', 'right', 'top', 'bottom'] },
    size: { control: 'inline-radio', options: ['sm', 'default', 'lg', 'full'] },
    hideFooter: { control: 'boolean' },
    closable: { control: 'boolean' },
    maskClosable: { control: 'boolean' },
    okDestructive: { control: 'boolean' },
  },
  args: {
    side: 'left',
    size: 'default',
    hideFooter: false,
    closable: true,
    maskClosable: true,
    okDestructive: false,
  },
  render: args => ({
    props: args,
    template: `
      <app-sheet-demo
        [side]="side"
        [size]="size"
        [hideFooter]="hideFooter"
        [closable]="closable"
        [maskClosable]="maskClosable"
        [okDestructive]="okDestructive"
      />
    `,
  }),
};

export default meta;
type Story = StoryObj<SheetArgs>;

export const Left: Story = {};

export const Right: Story = { args: { side: 'right' } };

export const Bottom: Story = { args: { side: 'bottom', size: 'sm' } };

export const WithoutFooter: Story = { args: { hideFooter: true } };

export const DestructiveAction: Story = { args: { side: 'right', okDestructive: true } };
