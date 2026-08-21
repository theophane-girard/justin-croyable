import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import {
  form,
  FormField,
  min,
  minLength,
  required,
} from '@angular/forms/signals';

import { BadgeComponent } from '@justin-croyable/design-system/components/badge';
import { InputDirective } from '@justin-croyable/design-system/components/input';
import { InputGroupComponent } from '@justin-croyable/design-system/components/input-group';
import {
  SegmentComponent,
  type SegmentItem,
} from '@justin-croyable/design-system/components/segment';
import {
  StepperImports,
  type StepperHeaderOption,
  type StepperOrientationVariants,
  type StepperSizeVariants,
} from '@justin-croyable/design-system/components/stepper';
import { provideIcons } from '@ng-icons/core';
import {
  phosphorLeaf,
  phosphorMapPin,
  phosphorRuler,
  phosphorSealCheck,
} from '@ng-icons/phosphor-icons/regular';
import {
  applicationConfig,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular-vite';
import { expect, userEvent, waitFor } from 'storybook/test';

type StepperArgs = {
  header: StepperHeaderOption;
  orientation: StepperOrientationVariants;
  size: StepperSizeVariants;
  linear: boolean;
  navigation: boolean;
};

const stepperIcons = provideIcons({
  phosphorMapPin,
  phosphorRuler,
  phosphorLeaf,
  phosphorSealCheck,
});

const meta: Meta<StepperArgs> = {
  title: 'Composants/Stepper',
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({ imports: [...StepperImports] }),
    applicationConfig({ providers: [stepperIcons] }),
  ],
  parameters: {
    docs: {
      description: {
        component: [
          "Formulaire à étapes bâti sur `@angular/cdk/stepper` : `app-stepper` étend `CdkStepper` et `app-step` étend `CdkStep`, donc la navigation clavier (flèches, Début/Fin, Espace/Entrée), le mode `linear` et les directives `cdkStepperNext` / `cdkStepperPrevious` sont ceux du CDK. Le composant n'apporte que l'habillage, l'accessibilité `tablist` / `tabpanel` et la navigation par défaut.",
          "**Signal forms.** Le CDK ne connaît que les formulaires réactifs classiques : son entrée `stepControl` attend un `AbstractControl`, ce qu'un `FieldTree` de `@angular/forms/signals` n'est pas. Le pont passe par l'entrée `completed`, dont dépend toute la logique de navigation du CDK (`isNavigable`, `indicatorType`, le verrou du mode `linear`) : on laisse `stepControl` vide et on lie `[completed]` à un `computed()` dérivé de la validité du champ. Voir l'histoire « Création de jardin ».",
          "**Responsive.** L'en-tête `auto` (par défaut) affiche les étapes numérotées sur grand écran et bascule sous 640px sur un rappel « Étape 2 sur 4 » avec barre de progression, une ligne d'étapes numérotées n'étant pas tenable sur un téléphone. `orientation=\"vertical\"` place l'en-tête en colonne à côté du contenu à partir de `md`, et revient au-dessus en dessous. Les boutons de navigation s'empilent en pleine largeur sur mobile.",
        ].join('\n\n'),
      },
    },
  },
  argTypes: {
    header: {
      control: 'inline-radio',
      options: ['auto', 'numbered', 'dots', 'progress'],
      description:
        '`auto` : étapes numérotées sur grand écran, barre de progression sous 640px.',
    },
    orientation: {
      control: 'inline-radio',
      options: ['horizontal', 'vertical'],
    },
    size: { control: 'inline-radio', options: ['sm', 'default'] },
    linear: {
      control: 'boolean',
      description:
        'Interdit de sauter une étape non `completed` (et non `optional`).',
    },
    navigation: {
      control: 'boolean',
      description:
        'Affiche les boutons Précédent / Suivant / Terminer fournis par le composant.',
    },
  },
  args: {
    header: 'auto',
    orientation: 'horizontal',
    size: 'default',
    linear: false,
    navigation: true,
  },
  render: (args) => ({
    props: args,
    template: `
      <div class="w-full max-w-3xl">
        <app-stepper
          [header]="header"
          [orientation]="orientation"
          [size]="size"
          [linear]="linear"
          [navigation]="navigation"
        >
          <app-step label="Emplacement" description="Ville et exposition" icon="phosphorMapPin">
            <p data-testid="panel-1" class="text-muted-foreground text-sm">
              Où se trouve le potager ?
            </p>
          </app-step>
          <app-step label="Parcelle" description="Surface et sol" icon="phosphorRuler">
            <p data-testid="panel-2" class="text-muted-foreground text-sm">
              Quelle surface cultivable ?
            </p>
          </app-step>
          <app-step label="Cultures" icon="phosphorLeaf" optional>
            <p data-testid="panel-3" class="text-muted-foreground text-sm">
              Que voulez-vous planter ?
            </p>
          </app-step>
          <app-step label="Récapitulatif" icon="phosphorSealCheck">
            <p data-testid="panel-4" class="text-muted-foreground text-sm">
              Tout est prêt.
            </p>
          </app-step>
        </app-stepper>
      </div>
    `,
  }),
};

export default meta;
type Story = StoryObj<StepperArgs>;

const visiblePanel = (canvasElement: HTMLElement): HTMLElement => {
  const panel = Array.from(
    canvasElement.querySelectorAll<HTMLElement>('[role="tabpanel"]'),
  ).find((candidate) => !candidate.hidden);
  if (!panel) {
    throw new Error('Aucun panneau visible dans le stepper.');
  }
  return panel;
};

const visiblePanelTestId = (canvasElement: HTMLElement): string | undefined =>
  visiblePanel(canvasElement).querySelector<HTMLElement>('[data-testid]')
    ?.dataset['testid'];

const buttonWithText = (
  canvasElement: HTMLElement,
  text: string,
): HTMLButtonElement => {
  const bouton = Array.from(canvasElement.querySelectorAll('button')).find(
    (candidate) => candidate.textContent?.trim() === text,
  );
  if (!bouton) {
    throw new Error(`Bouton « ${text} » introuvable.`);
  }
  return bouton;
};

export const Default: Story = {
  args: { header: 'numbered' },
  parameters: {
    docs: {
      description: {
        story:
          "L'en-tête est figé sur `numbered` : le test d'interaction cible la liste d'onglets, qui n'existe pas dans le rendu `progress` que `auto` choisit sous 640px.",
      },
    },
  },
  play: async ({ canvasElement }) => {
    const onglets = canvasElement.querySelectorAll('[role="tab"]');
    expect(onglets).toHaveLength(4);
    expect(onglets[0].getAttribute('aria-selected')).toBe('true');
    expect(visiblePanelTestId(canvasElement)).toBe('panel-1');

    const suivant = await waitFor(() =>
      buttonWithText(canvasElement, 'Suivant'),
    );

    await userEvent.click(suivant);
    await waitFor(() =>
      expect(visiblePanelTestId(canvasElement)).toBe('panel-2'),
    );
    expect(onglets[1].getAttribute('aria-selected')).toBe('true');

    await userEvent.click(onglets[0]);
    await waitFor(() =>
      expect(visiblePanelTestId(canvasElement)).toBe('panel-1'),
    );
    expect(onglets[0].getAttribute('data-state')).toBe('active');
    expect(onglets[1].getAttribute('data-state')).toBe('done');
  },
};

export const Vertical: Story = {
  args: { orientation: 'vertical', header: 'numbered' },
};

export const EnTeteAuto: Story = {
  args: { header: 'auto' },
  parameters: {
    docs: {
      description: {
        story:
          'Valeur par défaut : étapes numérotées à partir de 640px, rappel « Étape X sur Y » avec barre de progression en dessous. Réduisez la fenêtre pour voir la bascule.',
      },
    },
  },
};

export const EnTetesCompacts: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="flex w-full max-w-3xl flex-col gap-10">
        <app-stepper header="numbered" size="sm" [navigation]="false">
          <app-step label="Emplacement"><p class="text-sm">Numéroté, compact.</p></app-step>
          <app-step label="Parcelle"><p class="text-sm">Deux.</p></app-step>
          <app-step label="Cultures"><p class="text-sm">Trois.</p></app-step>
        </app-stepper>

        <app-stepper header="dots" [navigation]="false">
          <app-step label="Emplacement"><p class="text-sm">Points : le libellé passe en sr-only.</p></app-step>
          <app-step label="Parcelle"><p class="text-sm">Deux.</p></app-step>
          <app-step label="Cultures"><p class="text-sm">Trois.</p></app-step>
        </app-stepper>

        <app-stepper header="progress" [navigation]="false">
          <app-step label="Emplacement" description="Ville et exposition">
            <p class="text-sm">Progression : le rendu mobile de l'en-tête « auto ».</p>
          </app-step>
          <app-step label="Parcelle"><p class="text-sm">Deux.</p></app-step>
          <app-step label="Cultures"><p class="text-sm">Trois.</p></app-step>
        </app-stepper>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const steppers = canvasElement.querySelectorAll('app-stepper');
    expect(steppers).toHaveLength(3);
    expect(steppers[1].querySelectorAll('.sr-only')).toHaveLength(3);

    const progression = steppers[2].querySelector('[role="progressbar"]');
    expect(progression?.getAttribute('aria-valuenow')).toBe(
      '33.33333333333333',
    );
    expect(steppers[2].textContent).toContain('Étape 1 sur 3');
  },
};

export const EtapeEnErreur: Story = {
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div class="w-full max-w-3xl">
        <app-stepper [selectedIndex]="1">
          <app-step label="Identité" hasError errorMessage="Nom manquant">
            <p class="text-sm">Cette étape est marquée en erreur.</p>
          </app-step>
          <app-step label="Parcelle">
            <p class="text-sm">Étape courante.</p>
          </app-step>
        </app-stepper>
      </div>
    `,
  }),
  play: async ({ canvasElement }) => {
    const premier = canvasElement.querySelectorAll('[role="tab"]')[0];
    expect(premier.getAttribute('data-state')).toBe('error');
    expect(premier.textContent).toContain('Nom manquant');
  },
};

export const LibelleRiche: Story = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          "`<ng-template appStepLabel>` remplace le bloc libellé/description de l'en-tête numéroté par un gabarit libre — un badge, une icône, un compteur. L'entrée `label` reste requise : c'est elle que reprennent les en-têtes `dots` (en `sr-only`) et `progress`.",
      },
    },
  },
  render: () => ({
    template: `
      <div class="w-full max-w-3xl">
        <app-stepper header="numbered" [navigation]="false">
          <app-step label="Emplacement">
            <ng-template appStepLabel>
              <span class="flex items-center gap-2">
                Emplacement
                <app-badge type="secondary">2 parcelles</app-badge>
              </span>
            </ng-template>
            <p class="text-sm">Libellé enrichi par un badge du DS.</p>
          </app-step>
          <app-step label="Parcelle">
            <ng-template appStepLabel>
              <span class="flex items-center gap-2">
                Parcelle
                <app-badge type="outline">à faire</app-badge>
              </span>
            </ng-template>
            <p class="text-sm">Deux.</p>
          </app-step>
        </app-stepper>
      </div>
    `,
  }),
  decorators: [moduleMetadata({ imports: [BadgeComponent] })],
  play: async ({ canvasElement }) => {
    const premier = canvasElement.querySelectorAll('[role="tab"]')[0];
    expect(premier.textContent).toContain('2 parcelles');
  },
};

type GardenDraft = {
  name: string;
  city: string;
  surface: number;
  exposure: string;
};

const EXPOSURE_ITEMS: SegmentItem[] = [
  { value: 'sun', label: 'Plein soleil' },
  { value: 'half', label: 'Mi-ombre' },
  { value: 'shade', label: 'Ombre' },
];

@Component({
  selector: 'app-garden-wizard',
  imports: [
    ...StepperImports,
    InputDirective,
    InputGroupComponent,
    SegmentComponent,
    FormField,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full max-w-3xl">
      <app-stepper
        linear
        header="numbered"
        finishLabel="Créer le jardin"
        (finish)="createGarden()"
      >
        <app-step
          label="Identité"
          description="Nom et ville"
          icon="phosphorMapPin"
          [completed]="identityValid()"
        >
          <div class="flex flex-col gap-4 sm:flex-row">
            <app-input-group
              class="flex-1"
              label="Nom du jardin"
              hint="Trois caractères minimum."
              required
            >
              <input
                app-input
                type="text"
                placeholder="Le potager de la cour"
                [formField]="gardenForm.name"
              />
            </app-input-group>

            <app-input-group class="flex-1" label="Ville" required>
              <input
                app-input
                type="text"
                placeholder="Nantes"
                [formField]="gardenForm.city"
              />
            </app-input-group>
          </div>
        </app-step>

        <app-step
          label="Parcelle"
          description="Surface et exposition"
          icon="phosphorRuler"
          [completed]="plotValid()"
        >
          <div class="flex flex-col gap-4">
            <app-input-group
              class="sm:max-w-48"
              label="Surface cultivable (m²)"
              required
            >
              <input
                app-input
                type="number"
                min="1"
                [formField]="gardenForm.surface"
              />
            </app-input-group>

            <div class="flex flex-col gap-2">
              <span class="text-sm leading-none font-medium">Exposition</span>
              <app-segment
                [items]="exposureItems"
                [value]="draft().exposure"
                (valueChange)="setExposure($event)"
              />
            </div>
          </div>
        </app-step>

        <app-step
          label="Récapitulatif"
          icon="phosphorSealCheck"
          [completed]="identityValid() && plotValid()"
        >
          <dl
            class="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2"
            data-testid="wizard-summary"
          >
            <div
              class="flex justify-between gap-4 sm:flex-col sm:justify-start"
            >
              <dt class="text-muted-foreground">Jardin</dt>
              <dd class="font-medium">{{ draft().name }}</dd>
            </div>
            <div
              class="flex justify-between gap-4 sm:flex-col sm:justify-start"
            >
              <dt class="text-muted-foreground">Ville</dt>
              <dd class="font-medium">{{ draft().city }}</dd>
            </div>
            <div
              class="flex justify-between gap-4 sm:flex-col sm:justify-start"
            >
              <dt class="text-muted-foreground">Surface</dt>
              <dd class="font-medium">{{ draft().surface }} m²</dd>
            </div>
            <div
              class="flex justify-between gap-4 sm:flex-col sm:justify-start"
            >
              <dt class="text-muted-foreground">Exposition</dt>
              <dd class="font-medium">{{ exposureLabel() }}</dd>
            </div>
          </dl>
        </app-step>
      </app-stepper>

      @if (createdName()) {
        <p
          class="text-primary mt-4 text-sm font-medium"
          data-testid="wizard-result"
        >
          Jardin « {{ createdName() }} » créé.
        </p>
      }
    </div>
  `,
})
class GardenWizardComponent {
  protected readonly exposureItems = EXPOSURE_ITEMS;

  protected readonly draft = signal<GardenDraft>({
    name: '',
    city: '',
    surface: 20,
    exposure: '',
  });

  protected readonly gardenForm = form(this.draft, (path) => {
    required(path.name);
    minLength(path.name, 3);
    required(path.city);
    min(path.surface, 1);
    required(path.exposure);
  });

  protected readonly createdName = signal('');

  protected readonly identityValid = computed(
    () => this.gardenForm.name().valid() && this.gardenForm.city().valid(),
  );

  protected readonly plotValid = computed(
    () =>
      this.gardenForm.surface().valid() && this.gardenForm.exposure().valid(),
  );

  protected readonly exposureLabel = computed(
    () =>
      EXPOSURE_ITEMS.find((item) => item.value === this.draft().exposure)
        ?.label ?? '—',
  );

  protected setExposure(value: string): void {
    this.draft.update((current) => ({ ...current, exposure: value }));
  }

  protected createGarden(): void {
    this.createdName.set(this.draft().name);
  }
}

export const CreationDeJardin: StoryObj = {
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        story:
          "Mode `linear` piloté par des signal forms : chaque `app-step` lie `[completed]` à un `computed()` sur la validité de ses champs, donc « Suivant » reste verrouillé — et les étapes suivantes non navigables — jusqu'à ce que le champ soit valide. Aucun `stepControl` n'est fourni.",
      },
    },
  },
  render: () => ({ template: '<app-garden-wizard />' }),
  decorators: [moduleMetadata({ imports: [GardenWizardComponent] })],
  play: async ({ canvasElement }) => {
    const nextButton = await waitFor(() =>
      buttonWithText(canvasElement, 'Suivant'),
    );

    expect(nextButton.disabled).toBe(true);
    const onglets = canvasElement.querySelectorAll('[role="tab"]');
    expect(onglets[0].getAttribute('data-state')).toBe('active');
    expect(onglets[1].getAttribute('aria-disabled')).toBe('true');

    const champs =
      canvasElement.querySelectorAll<HTMLInputElement>('input[type="text"]');
    await userEvent.type(champs[0], 'Cour intérieure');
    await userEvent.type(champs[1], 'Nantes');

    await waitFor(() => expect(nextButton.disabled).toBe(false));

    await userEvent.click(nextButton);
    await waitFor(() =>
      expect(visiblePanel(canvasElement).textContent).toContain(
        'Surface cultivable',
      ),
    );
    expect(onglets[0].getAttribute('data-state')).toBe('done');
    expect(onglets[1].getAttribute('aria-disabled')).toBeNull();

    await waitFor(() => expect(nextButton.disabled).toBe(true));
    await userEvent.click(canvasElement.querySelectorAll('[role="radio"]')[0]);
    await waitFor(() => expect(nextButton.disabled).toBe(false));

    await userEvent.click(nextButton);
    await waitFor(() =>
      expect(
        canvasElement.querySelector('[data-testid="wizard-summary"]'),
      ).toBeTruthy(),
    );
    expect(
      canvasElement.querySelector('[data-testid="wizard-summary"]')
        ?.textContent,
    ).toContain('Cour intérieure');

    await userEvent.click(buttonWithText(canvasElement, 'Créer le jardin'));
    await waitFor(() =>
      expect(
        canvasElement.querySelector('[data-testid="wizard-result"]')
          ?.textContent,
      ).toContain('Cour intérieure'),
    );
  },
};
