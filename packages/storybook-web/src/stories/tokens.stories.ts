import type { Meta, StoryObj } from '@storybook/angular-vite';

/**
 * Ces stories ne montrent aucun composant : elles rendent visible ce que le
 * preset Tailwind du DS expose réellement. Chaque pastille est une classe
 * utilitaire (`bg-primary`, `bg-muted`, …) — si le preset n'était pas importé,
 * ou si un token disparaissait, la pastille correspondante deviendrait
 * transparente. C'est la vérification la moins coûteuse du câblage du thème.
 */
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

/** Rôles sémantiques — la surface que les composants consomment. */
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

/** Bordure, champ et anneau de focus : les rôles de contour. */
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

/** Rayons dérivés de `--radius`. */
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

/**
 * Palette complémentaire, décorative. Les pas 300–700 sont trop proches des
 * teintes réservées (error, warning, success, info, marque) pour porter seuls
 * un statut — cf. le tableau d'écarts ΔE dans `primitives.css`.
 */
export const DecorativeRamps: Story = {
  render: () => ({
    // Les classes sont écrites en entier, jamais concaténées : Tailwind scanne
    // du texte, donc `'bg-' + family + '-' + step` produirait des classes
    // introuvables à la compilation et purgées du bundle.
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
