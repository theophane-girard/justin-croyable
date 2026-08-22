import { cva, type VariantProps } from 'class-variance-authority';

const DAY_SKY_CLASSES = 'bg-gradient-to-b from-sky-300 to-sky-100';

const STARRY_NIGHT_SKY_CLASSES =
  'dark:bg-[radial-gradient(1.6px_1.6px_at_12%_18%,white,transparent),radial-gradient(1.2px_1.2px_at_28%_9%,white,transparent),radial-gradient(1.8px_1.8px_at_44%_24%,white,transparent),radial-gradient(1.1px_1.1px_at_61%_13%,white,transparent),radial-gradient(1.5px_1.5px_at_74%_30%,white,transparent),radial-gradient(1.2px_1.2px_at_88%_16%,white,transparent),radial-gradient(1.4px_1.4px_at_19%_38%,white,transparent),radial-gradient(1px_1px_at_53%_43%,white,transparent),radial-gradient(1.3px_1.3px_at_82%_47%,white,transparent),radial-gradient(1.1px_1.1px_at_35%_52%,white,transparent),linear-gradient(to_bottom,#0a1020,#1b2540)]';

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

export type SceneCanvasSkyVariants = NonNullable<VariantProps<typeof sceneCanvasVariants>['sky']>;
