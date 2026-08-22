import { cva, type VariantProps } from 'class-variance-authority';

const DAY_SKY_CLASSES =
  'bg-[linear-gradient(to_bottom,#38bdf8_0%,#7dd3fc_5%,#bae6fd_10%,#e0f2fe_15%,#e0f2fe_100%)]';

const STARRY_NIGHT_SKY_CLASSES =
  'dark:bg-[radial-gradient(1.6px_1.6px_at_12%_6%,white,transparent),radial-gradient(1.2px_1.2px_at_28%_11%,white,transparent),radial-gradient(1.8px_1.8px_at_44%_4%,white,transparent),radial-gradient(1.1px_1.1px_at_61%_9%,white,transparent),radial-gradient(1.5px_1.5px_at_74%_14%,white,transparent),radial-gradient(1.2px_1.2px_at_88%_7%,white,transparent),radial-gradient(1.4px_1.4px_at_19%_17%,white,transparent),radial-gradient(1.0px_1.0px_at_53%_20%,white,transparent),radial-gradient(1.3px_1.3px_at_82%_22%,white,transparent),radial-gradient(1.1px_1.1px_at_35%_13%,white,transparent),radial-gradient(1.2px_1.2px_at_6%_12%,white,transparent),radial-gradient(1.0px_1.0px_at_67%_18%,white,transparent),radial-gradient(1.3px_1.3px_at_95%_16%,white,transparent),linear-gradient(to_bottom,#060b18_0%,#0a1020_6%,#141c33_11%,#1b2540_16%,#1b2540_100%)]';

export const sceneCanvasVariants = cva(
  'border-border relative block w-full overflow-hidden rounded-xl border',
  {
    variants: {
      sky: {
        none: 'from-muted to-background bg-gradient-to-b',
        open: `${DAY_SKY_CLASSES} ${STARRY_NIGHT_SKY_CLASSES}`,
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
