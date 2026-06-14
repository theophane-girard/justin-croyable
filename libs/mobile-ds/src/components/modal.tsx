import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Modal as RNModal,
  Pressable,
  View,
  type ModalProps as RNModalProps,
} from 'react-native';

import { cn } from '../utils/cn';
import { Text } from './text';
import { useThemeVars } from '../theme/theme-provider';

export interface ModalProps
  extends Omit<RNModalProps, 'visible' | 'onRequestClose' | 'animationType'> {
  /** Affiche ou masque la modale. */
  visible: boolean;
  /** Appelé à la fermeture (appui hors contenu ou bouton retour Android). */
  onClose?: () => void;
  /** Titre affiché en en-tête. */
  title?: string;
  /** Ferme la modale en appuyant sur l'arrière-plan. */
  dismissOnBackdropPress?: boolean;
  className?: string;
  children?: ReactNode;
}

/**
 * Modale centrée, thémée, avec une animation d'entrée/sortie en fondu + zoom.
 *
 * Le contenu est rendu dans une racine native séparée : on ré-injecte les
 * variables de thème (dark/light inclus).
 */
export function Modal({
  visible,
  onClose,
  title,
  dismissOnBackdropPress = true,
  className,
  children,
  ...props
}: ModalProps) {
  const themeVars = useThemeVars();
  const progress = useRef(new Animated.Value(0)).current;
  // On garde la modale montée pendant l'animation de sortie.
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.spring(progress, {
        toValue: 1,
        useNativeDriver: false,
        friction: 8,
        tension: 90,
      }).start();
    } else if (mounted) {
      Animated.timing(progress, {
        toValue: 0,
        duration: 150,
        useNativeDriver: false,
      }).start((result) => {
        if (result?.finished) setMounted(false);
      });
    }
  }, [visible, mounted, progress]);

  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
  });

  return (
    <RNModal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={onClose}
      {...props}
    >
      <View style={themeVars} className="flex-1">
        <Animated.View style={{ flex: 1, opacity: progress }}>
          <Pressable
            className="flex-1 items-center justify-center bg-black/50 p-6"
            onPress={dismissOnBackdropPress ? onClose : undefined}
          >
            <Animated.View style={{ transform: [{ scale }], width: '100%', alignItems: 'center' }}>
              {/* Stoppe la propagation : un appui sur le contenu ne ferme pas. */}
              <Pressable
                onPress={(e) => e.stopPropagation()}
                className={cn(
                  'w-full max-w-md gap-3 rounded-xl border border-border bg-card p-5 shadow-lg',
                  className
                )}
              >
                {title ? (
                  <Text variant="h4" className="text-card-foreground">
                    {title}
                  </Text>
                ) : null}
                {children}
              </Pressable>
            </Animated.View>
          </Pressable>
        </Animated.View>
      </View>
    </RNModal>
  );
}
