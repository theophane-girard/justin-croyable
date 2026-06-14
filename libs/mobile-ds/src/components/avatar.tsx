import { useState } from 'react';
import { Image, View, type ImageSourcePropType } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../utils/cn';
import { Text } from './text';

const avatarVariants = cva(
  'items-center justify-center overflow-hidden rounded-full bg-muted',
  {
    variants: {
      size: {
        sm: 'h-8 w-8',
        md: 'h-12 w-12',
        lg: 'h-16 w-16',
        xl: 'h-24 w-24',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

const fallbackTextVariants = cva('font-semibold text-muted-foreground', {
  variants: {
    size: {
      sm: 'text-xs',
      md: 'text-base',
      lg: 'text-xl',
      xl: 'text-3xl',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export interface AvatarProps extends VariantProps<typeof avatarVariants> {
  /** Source de l'image (URI ou require). */
  source?: ImageSourcePropType;
  /** Nom utilisé pour générer les initiales en cas d'absence d'image. */
  name?: string;
  className?: string;
}

/** Première lettre de chaque mot, max 2 caractères (ex. "Théo Girard" -> "TG"). */
function getInitials(name?: string): string {
  if (!name) return '';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

/** Avatar circulaire avec repli sur les initiales si l'image est absente ou échoue. */
export function Avatar({ source, name, size, className }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const showImage = !!source && !failed;

  return (
    <View className={cn(avatarVariants({ size }), className)}>
      {showImage ? (
        <Image
          source={source}
          onError={() => setFailed(true)}
          className="h-full w-full"
          resizeMode="cover"
        />
      ) : (
        <Text className={cn(fallbackTextVariants({ size }))}>
          {getInitials(name)}
        </Text>
      )}
    </View>
  );
}
