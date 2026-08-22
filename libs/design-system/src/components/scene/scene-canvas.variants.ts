import { cva, type VariantProps } from 'class-variance-authority';

const DAY_SKY_CLASSES = 'bg-[linear-gradient(to_bottom,#38bdf8_0%,#7dd3fc_55%,#bae6fd_100%)]';

const STARRY_NIGHT_SKY_CLASSES =
  'dark:bg-[radial-gradient(1.5px_1.5px_at_9%_7%,white,transparent),radial-gradient(1.1px_1.1px_at_21%_15%,white,transparent),radial-gradient(1.7px_1.7px_at_33%_5%,white,transparent),radial-gradient(1.2px_1.2px_at_45%_21%,white,transparent),radial-gradient(1.4px_1.4px_at_57%_11%,white,transparent),radial-gradient(1.0px_1.0px_at_69%_26%,white,transparent),radial-gradient(1.3px_1.3px_at_81%_9%,white,transparent),radial-gradient(1.2px_1.2px_at_93%_18%,white,transparent),radial-gradient(1.1px_1.1px_at_15%_32%,white,transparent),radial-gradient(1.3px_1.3px_at_38%_38%,white,transparent),radial-gradient(1.0px_1.0px_at_63%_44%,white,transparent),radial-gradient(1.2px_1.2px_at_87%_35%,white,transparent),radial-gradient(1.1px_1.1px_at_27%_49%,white,transparent),radial-gradient(1.0px_1.0px_at_74%_56%,white,transparent),radial-gradient(1.4px_1.4px_at_50%_30%,white,transparent),radial-gradient(1.2px_1.2px_at_5%_23%,white,transparent),linear-gradient(to_bottom,#050a16_0%,#0a1020_55%,#141c33_100%)]';

export const OPEN_SKY = 'open';

export const sceneCanvasVariants = cva(
  'border-border relative block w-full overflow-hidden rounded-xl border',
  {
    variants: {
      sky: {
        none: 'from-muted to-background bg-gradient-to-b',
        [OPEN_SKY]: `${DAY_SKY_CLASSES} ${STARRY_NIGHT_SKY_CLASSES}`,
      },
    },
    defaultVariants: {
      sky: 'none',
    },
  },
);

/** Teintes de brume s'accordant au bas du dégradé de `sky="open"`. */
export const OPEN_SKY_HAZE = { light: '#e0f2fe', dark: '#1b2540' } as const;

export type SceneCanvasSkyVariants = NonNullable<VariantProps<typeof sceneCanvasVariants>['sky']>;
