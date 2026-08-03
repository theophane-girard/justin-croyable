import type { Meta, StoryObj } from '@storybook/angular-vite';

const meta: Meta = {
  title: 'Design System/Tokens',
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Le DS livre son thème en CSS (`@justin-croyable/design-system/theme.css`), plus un preset JS de compatibilité (`tailwind.preset.js`) pour les consommateurs Tailwind v3. Les rôles sont les seuls tokens que les composants utilisent ; les rampes brutes sont décoratives.",
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// Classes littérales (et non `bg-brand-${step}`) : le scanner Tailwind ne
// détecte que les noms de classe présents tels quels dans le source.
const brandRamp = [
  'bg-brand-50',
  'bg-brand-100',
  'bg-brand-200',
  'bg-brand-300',
  'bg-brand-400',
  'bg-brand-500',
  'bg-brand-600',
  'bg-brand-700',
  'bg-brand-800',
  'bg-brand-900',
];

export const Palette: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Identité de la palette active : la rampe de marque (`bg-brand-*`), le rôle `bg-brand`, et les neutres/action exposés en rôles (teintés vers la marque). Basculer la toolbar « Palette » retinte l'ensemble sans rebuild — la sélection réelle se fait à la compilation via `@import '.../palettes/<nom>.css'`. Les rôles `primary`/`secondary`/`muted` de la story « Roles » suivent la même bascule.",
      },
    },
  },
  render: () => ({
    props: {
      ramp: brandRamp,
      neutrals: [
        { name: 'background', className: 'bg-background text-foreground border' },
        { name: 'card', className: 'bg-card text-card-foreground border' },
        { name: 'muted', className: 'bg-muted text-muted-foreground' },
        { name: 'primary', className: 'bg-primary text-primary-foreground' },
      ],
    },
    template: `
      <div class="flex flex-col gap-6">
        <div class="flex items-center gap-4">
          <div class="flex h-16 w-40 items-end rounded-lg bg-brand p-2">
            <span class="text-xs font-medium text-white">bg-brand</span>
          </div>
          <span class="text-xs text-muted-foreground">rôle de marque (= brand-600)</span>
        </div>
        <div class="flex items-center gap-3">
          <span class="w-16 text-xs text-muted-foreground">brand</span>
          <div class="flex overflow-hidden rounded-md">
            @for (swatch of ramp; track swatch) {
              <div [class]="'size-10 ' + swatch" [title]="swatch"></div>
            }
          </div>
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          @for (role of neutrals; track role.name) {
            <div [class]="'flex h-16 flex-col justify-end rounded-lg p-3 ' + role.className">
              <span class="text-xs font-medium">{{ role.name }}</span>
            </div>
          }
        </div>
      </div>
    `,
  }),
};

export const Typography: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Tokens de police (`font-display`, `font-body`, `font-mono`). Le DS expose les utilitaires ; le chargement des fontes (Space Grotesk, Inter, JetBrains Mono) reste à la charge de l’app — sans fichiers chargés, le rendu retombe sur `system-ui`.',
      },
    },
  },
  render: () => ({
    props: {
      fonts: [
        { utility: 'font-display', label: 'Display — Space Grotesk' },
        { utility: 'font-body', label: 'Body — Inter' },
        { utility: 'font-mono', label: 'Mono — JetBrains Mono' },
      ],
    },
    template: `
      <div class="flex flex-col gap-5">
        @for (font of fonts; track font.utility) {
          <div class="flex flex-col gap-1">
            <span class="text-xs text-muted-foreground">{{ font.utility }} · {{ font.label }}</span>
            <span [class]="'text-2xl ' + font.utility">Justin croyable — 0123456789</span>
          </div>
        }
      </div>
    `,
  }),
};

export const Roles: Story = {
  render: () => ({
    props: {
      roles: [
        { name: 'background / foreground', className: 'bg-background text-foreground border' },
        { name: 'card / card-foreground', className: 'bg-card text-card-foreground border' },
        { name: 'popover / popover-foreground', className: 'bg-popover text-popover-foreground border' },
        { name: 'primary / primary-foreground', className: 'bg-primary text-primary-foreground' },
        { name: 'secondary / secondary-foreground', className: 'bg-secondary text-secondary-foreground' },
        { name: 'muted / muted-foreground', className: 'bg-muted text-muted-foreground' },
        { name: 'accent / accent-foreground', className: 'bg-accent text-accent-foreground' },
        { name: 'destructive', className: 'bg-destructive text-white' },
      ],
    },
    template: `
      <div class="grid gap-3 sm:grid-cols-2">
        @for (role of roles; track role.name) {
          <div [class]="'flex h-20 flex-col justify-end rounded-lg p-3 ' + role.className">
            <span class="text-xs font-medium">{{ role.name }}</span>
          </div>
        }
      </div>
    `,
  }),
};

export const Outlines: Story = {
  render: () => ({
    template: `
      <div class="flex flex-wrap items-center gap-6">
        <div class="rounded-lg border-2 border-border p-4 text-xs">border</div>
        <div class="rounded-lg border-2 border-input p-4 text-xs">input</div>
        <div class="rounded-lg p-4 text-xs ring-3 ring-ring/50">ring / 50 %</div>
      </div>
    `,
  }),
};

export const Radii: Story = {
  render: () => ({
    props: { radii: ['rounded-sm', 'rounded-md', 'rounded-lg', 'rounded-xl'] },
    template: `
      <div class="flex flex-wrap items-end gap-4">
        @for (radius of radii; track radius) {
          <div class="flex flex-col items-center gap-2">
            <div [class]="'size-16 bg-primary/15 border border-primary/40 ' + radius"></div>
            <span class="text-xs text-muted-foreground">{{ radius }}</span>
          </div>
        }
      </div>
    `,
  }),
};

export const DecorativeRamps: Story = {
  render: () => ({
    props: {
      ramps: [
        {
          family: 'orange',
          swatches: [
            'bg-orange-50',
            'bg-orange-100',
            'bg-orange-200',
            'bg-orange-300',
            'bg-orange-400',
            'bg-orange-500',
            'bg-orange-600',
            'bg-orange-700',
            'bg-orange-800',
            'bg-orange-900',
          ],
        },
        {
          family: 'lime',
          swatches: [
            'bg-lime-50',
            'bg-lime-100',
            'bg-lime-200',
            'bg-lime-300',
            'bg-lime-400',
            'bg-lime-500',
            'bg-lime-600',
            'bg-lime-700',
            'bg-lime-800',
            'bg-lime-900',
          ],
        },
        {
          family: 'cyan',
          swatches: [
            'bg-cyan-50',
            'bg-cyan-100',
            'bg-cyan-200',
            'bg-cyan-300',
            'bg-cyan-400',
            'bg-cyan-500',
            'bg-cyan-600',
            'bg-cyan-700',
            'bg-cyan-800',
            'bg-cyan-900',
          ],
        },
        {
          family: 'violet',
          swatches: [
            'bg-violet-50',
            'bg-violet-100',
            'bg-violet-200',
            'bg-violet-300',
            'bg-violet-400',
            'bg-violet-500',
            'bg-violet-600',
            'bg-violet-700',
            'bg-violet-800',
            'bg-violet-900',
          ],
        },
        {
          family: 'rose',
          swatches: [
            'bg-rose-50',
            'bg-rose-100',
            'bg-rose-200',
            'bg-rose-300',
            'bg-rose-400',
            'bg-rose-500',
            'bg-rose-600',
            'bg-rose-700',
            'bg-rose-800',
            'bg-rose-900',
          ],
        },
        {
          family: 'magenta',
          swatches: [
            'bg-magenta-50',
            'bg-magenta-100',
            'bg-magenta-200',
            'bg-magenta-300',
            'bg-magenta-400',
            'bg-magenta-500',
            'bg-magenta-600',
            'bg-magenta-700',
            'bg-magenta-800',
            'bg-magenta-900',
          ],
        },
      ],
    },
    template: `
      <div class="flex flex-col gap-3">
        @for (ramp of ramps; track ramp.family) {
          <div class="flex items-center gap-3">
            <span class="w-16 text-xs text-muted-foreground">{{ ramp.family }}</span>
            <div class="flex overflow-hidden rounded-md">
              @for (swatch of ramp.swatches; track swatch) {
                <div [class]="'size-10 ' + swatch" [title]="swatch"></div>
              }
            </div>
          </div>
        }
      </div>
    `,
  }),
};
