import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import {
  ButtonComponent,
  SonnerComponent,
  SonnerService,
  type SonnerPosition,
} from '@justin-croyable/design-system';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';

@Component({
  selector: 'app-sonner-demo',
  imports: [SonnerComponent, ButtonComponent],
  template: `
    <app-sonner
      [position]="position()"
      [richColors]="richColors()"
      [expand]="expand()"
      [closeButton]="closeButton()"
      [duration]="duration()"
      [visibleToasts]="visibleToasts()"
    />

    <div class="flex flex-wrap items-center gap-2 pt-32">
      <button appButton (click)="sonner.message('Événement enregistré')">Message</button>
      <button appButton variant="outline" (click)="notifySuccess()">Succès</button>
      <button appButton variant="outline" (click)="notifyError()">Erreur</button>
      <button appButton variant="outline" (click)="sonner.warning('Quota bientôt atteint')">
        Avertissement
      </button>
      <button appButton variant="outline" (click)="sonner.info('Version 2.4 déployée')">Info</button>
      <button appButton variant="secondary" (click)="notifyPromise()">Promesse</button>
      <button appButton variant="ghost" (click)="sonner.dismiss()">Tout fermer</button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class SonnerDemoComponent {
  protected readonly sonner = inject(SonnerService);

  readonly position = input<SonnerPosition>('top-center');
  readonly richColors = input(false);
  readonly expand = input(false);
  readonly closeButton = input(false);
  readonly duration = input(4000);
  readonly visibleToasts = input(3);

  protected notifySuccess(): void {
    this.sonner.success('Profil enregistré', { description: 'Vos modifications sont visibles.' });
  }

  protected notifyError(): void {
    this.sonner.error('Échec de l’enregistrement', { description: 'Réessayez dans un instant.' });
  }

  protected notifyPromise(): void {
    const save = new Promise(resolve => setTimeout(resolve, 1800));
    this.sonner.promise(save, {
      loading: 'Enregistrement…',
      success: 'Enregistré',
      error: 'Échec',
    });
  }
}

type SonnerArgs = {
  position: SonnerPosition;
  richColors: boolean;
  expand: boolean;
  closeButton: boolean;
  duration: number;
  visibleToasts: number;
};

const meta: Meta<SonnerArgs> = {
  title: 'Composants/Sonner',
  component: SonnerComponent,
  tags: ['autodocs'],
  decorators: [moduleMetadata({ imports: [SonnerDemoComponent] })],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          "Toaster bâti sur `ngx-sonner`. `<app-sonner />` se monte une seule fois (typiquement dans le composant racine) et porte la configuration ; l'émission passe par `SonnerService` : `show`, `success`, `error`, `warning`, `info`, `loading`, `message`, `promise`, `dismiss` et `custom`. Les couleurs viennent des rôles du DS — le composant mappe `--normal-bg`, `--normal-text` et `--normal-border` sur `popover`, `popover-foreground` et `border`.",
      },
    },
  },
  argTypes: {
    position: {
      control: 'select',
      options: [
        'top-left',
        'top-center',
        'top-right',
        'bottom-left',
        'bottom-center',
        'bottom-right',
      ],
    },
    richColors: { control: 'boolean', description: 'Fond coloré selon le type de toast.' },
    expand: { control: 'boolean', description: 'Déplie la pile au lieu de l’empiler.' },
    closeButton: { control: 'boolean' },
    duration: { control: { type: 'number', min: 1000, max: 10000, step: 500 } },
    visibleToasts: { control: { type: 'number', min: 1, max: 6 } },
  },
  args: {
    position: 'top-center',
    richColors: false,
    expand: false,
    closeButton: false,
    duration: 4000,
    visibleToasts: 3,
  },
  render: args => ({
    props: args,
    template: `
      <app-sonner-demo
        [position]="position"
        [richColors]="richColors"
        [expand]="expand"
        [closeButton]="closeButton"
        [duration]="duration"
        [visibleToasts]="visibleToasts"
      />
    `,
  }),
};

export default meta;
type Story = StoryObj<SonnerArgs>;

export const Default: Story = {};

export const RichColors: Story = { args: { richColors: true } };

export const BottomRight: Story = { args: { position: 'bottom-right' } };

export const WithCloseButton: Story = { args: { closeButton: true } };

export const Expanded: Story = { args: { expand: true, visibleToasts: 5 } };
