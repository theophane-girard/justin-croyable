import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { ButtonComponent } from '@justin-croyable/design-system/components/button';
import { SheetService, type SheetVariants } from '@justin-croyable/design-system/components/sheet';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';

type Side = NonNullable<SheetVariants['side']>;
type Size = NonNullable<SheetVariants['size']>;

const CONTENU_COURT = 'Le contenu accepte une chaîne, un TemplateRef ou un composant.';

const CONTENU_LONG = Array.from(
  { length: 30 },
  (_, index) => `<p data-testid="ligne-longue">Critère de filtrage n° ${index + 1}</p>`,
).join('');

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
  readonly longContent = input(false);

  protected open(): void {
    this.sheet.create({
      title: 'Filtres',
      description: 'Affinez la liste des résultats.',
      content: this.longContent() ? CONTENU_LONG : CONTENU_COURT,
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
  longContent: boolean;
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
          "Panneau latéral ouvert par service : `SheetService.create()` reçoit les options — côté, taille, titre, contenu, libellés des actions — et renvoie un `SheetRef` pour fermer le panneau et récupérer un résultat. Le contenu accepte une chaîne, un `TemplateRef` ou un composant, auquel les données passent par le jeton `SHEET_DATA`. En `side: 'bottom'`, le panneau reçoit la poignée commune aux bottom sheets du DS — glisser vers le haut pour agrandir, vers le bas pour fermer — et son contenu défile sans déclencher le rafraîchissement natif du navigateur.",
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
    longContent: {
      control: 'boolean',
      description: 'Contenu plus haut que la fenêtre, pour vérifier le défilement interne.',
    },
  },
  args: {
    longContent: false,
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
        [longContent]="longContent"
      />
    `,
  }),
};

export default meta;
type Story = StoryObj<SheetArgs>;

async function ouvrirPanneau(canvasElement: HTMLElement): Promise<HTMLElement> {
  await userEvent.click(within(canvasElement).getByRole('button'));
  return waitFor(() => {
    const panneau = document.querySelector<HTMLElement>('[data-slot="sheet"]');
    expect(panneau).toBeTruthy();
    return panneau!;
  });
}

function attendreImage(): Promise<void> {
  return new Promise(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

async function glisser(depuis: HTMLElement, distance: number): Promise<void> {
  const rect = depuis.getBoundingClientRect();
  const clientX = rect.left + rect.width / 2;
  const départ = rect.top + rect.height / 2;
  const sens = Math.sign(distance);
  const options = (clientY: number) => ({
    bubbles: true,
    cancelable: true,
    clientX,
    clientY,
    pointerId: 1,
    pointerType: 'touch',
  });

  depuis.dispatchEvent(new PointerEvent('pointerdown', options(départ)));
  [8 * sens, distance / 2, distance].forEach(parcouru =>
    window.dispatchEvent(new PointerEvent('pointermove', options(départ + parcouru))),
  );

  await attendreImage();

  window.dispatchEvent(new PointerEvent('pointerup', options(départ + distance)));
}

async function fermerParAnnuler(): Promise<void> {
  await userEvent.click(within(document.body).getByRole('button', { name: 'Annuler' }));
  await waitFor(() => {
    expect(document.querySelector('[data-slot="sheet"]')).toBeNull();
  });
}

export const Left: Story = {
  play: async ({ canvasElement }) => {
    const panneau = await ouvrirPanneau(canvasElement);

    expect(panneau.querySelector('[data-slot="sheet-title"]')?.textContent?.trim()).toBe('Filtres');
    const actions = [...panneau.querySelectorAll('[data-slot="sheet-footer"] button')].map(bouton =>
      bouton.textContent?.trim(),
    );
    expect(actions).toEqual(['Appliquer', 'Annuler']);

    await fermerParAnnuler();
  },
};

export const Right: Story = {
  args: { side: 'right' },
  play: async ({ canvasElement }) => {
    const panneau = await ouvrirPanneau(canvasElement);
    expect(panneau.getAttribute('data-side') ?? panneau.className).toContain('right');
    expect(panneau.querySelector('app-sheet-handle')).toBeNull();

    await fermerParAnnuler();
  },
};

export const Bottom: Story = {
  args: { side: 'bottom', size: 'sm' },
  play: async ({ canvasElement }) => {
    const panneau = await ouvrirPanneau(canvasElement);

    expect(panneau.querySelector('app-sheet-handle')).toBeTruthy();

    await fermerParAnnuler();
  },
};

export const BottomSwipeToExpand: Story = {
  args: { side: 'bottom', longContent: true },
  parameters: {
    docs: {
      description: {
        story:
          "Un glissé vers le haut agrandit le panneau, où qu'il commence, tant que le panneau n'est pas déjà déployé — une fois déployé, le même geste défile le contenu.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const panneau = await ouvrirPanneau(canvasElement);
    const corps = panneau.querySelector<HTMLElement>('main');
    if (!corps) {
      throw new Error('Le corps du panneau est introuvable.');
    }

    const hauteurInitiale = panneau.getBoundingClientRect().height;

    corps.scrollTop = 0;
    await glisser(corps, -260);
    await waitFor(() => {
      expect(panneau.getBoundingClientRect().height).toBeGreaterThan(hauteurInitiale);
    });

    await fermerParAnnuler();
  },
};

export const BottomSwipeToDismiss: Story = {
  args: { side: 'bottom', longContent: true },
  parameters: {
    docs: {
      description: {
        story:
          "Le geste de fermeture part de n'importe où dans le panneau, comme sur les bottom sheets natifs : le panneau ne prend la main que si le contenu est déjà en haut, sinon le contenu défile normalement.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const panneau = await ouvrirPanneau(canvasElement);
    const corps = panneau.querySelector<HTMLElement>('main');
    if (!corps) {
      throw new Error('Le corps du panneau est introuvable.');
    }

    corps.scrollTop = 200;
    await glisser(corps, 200);
    expect(document.querySelector('[data-slot="sheet"]')).toBeTruthy();

    corps.scrollTop = 0;
    await glisser(corps, 200);
    await waitFor(() => {
      expect(document.querySelector('[data-slot="sheet"]')).toBeNull();
    });
  },
};

export const BottomLongContent: Story = {
  args: { side: 'bottom', longContent: true },
  parameters: {
    docs: {
      description: {
        story:
          "Le panneau ne dépasse jamais la fenêtre : l'en-tête et le pied restent visibles, seul le contenu défile.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const panneau = await ouvrirPanneau(canvasElement);
    const corps = panneau.querySelector<HTMLElement>('main');
    if (!corps) {
      throw new Error('Le corps du panneau est introuvable.');
    }

    expect(panneau.querySelector('app-sheet-handle')).toBeTruthy();
    expect(panneau.getBoundingClientRect().height).toBeLessThanOrEqual(window.innerHeight);
    expect(corps.scrollHeight).toBeGreaterThan(corps.clientHeight);

    corps.scrollTop = corps.scrollHeight;
    await waitFor(() => expect(corps.scrollTop).toBeGreaterThan(0));

    await fermerParAnnuler();
  },
};

export const WithoutFooter: Story = { args: { hideFooter: true } };

export const DestructiveAction: Story = { args: { side: 'right', okDestructive: true } };
