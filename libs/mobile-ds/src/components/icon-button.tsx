import { Pressable, type PressableProps } from 'react-native';
import type { Icon, IconWeight } from 'phosphor-react-native';

import { cn } from '../utils/cn';
import { useTheme } from '../theme/theme-provider';
import { channelsToRgb } from '../utils/color';

export interface IconButtonProps extends Omit<PressableProps, 'children'> {
  /** Composant d'icône Phosphor (ex. `CaretLeft`). */
  icon: Icon;
  /** Taille de l'icône en px. */
  size?: number;
  /** Graisse Phosphor (`regular`, `bold`, `fill`…). */
  weight?: IconWeight;
  /** Couleur de l'icône. Par défaut : token `foreground` du thème. */
  color?: string;
  /** Libellé d'accessibilité (obligatoire : bouton sans texte). */
  accessibilityLabel: string;
  className?: string;
  disabled?: boolean;
}

/** Bouton tactile rond ne contenant qu'une icône Phosphor. */
export function IconButton({
  icon: IconComponent,
  size = 24,
  weight = 'regular',
  color,
  accessibilityLabel,
  disabled = false,
  className,
  ...props
}: IconButtonProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      className={cn(
        'h-10 w-10 items-center justify-center rounded-full active:bg-accent',
        disabled && 'opacity-50',
        className
      )}
      {...props}
    >
      <IconComponent
        size={size}
        weight={weight}
        color={color ?? channelsToRgb(colors.foreground)}
      />
    </Pressable>
  );
}
