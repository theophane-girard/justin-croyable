import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Modal as RNModal,
  Pressable,
  ScrollView,
  View,
} from 'react-native';

import { cn } from '../utils/cn';
import { Text } from './text';
import { useThemeVars } from '../theme/theme-provider';

export interface BottomSheetProps {
  /** Affiche ou masque la feuille. */
  visible: boolean;
  /** Appelé à la fermeture (appui sur l'arrière-plan ou bouton retour Android). */
  onClose?: () => void;
  /** Titre affiché en haut de la feuille. */
  title?: string;
  /** Ferme la feuille en appuyant sur l'arrière-plan. */
  dismissOnBackdropPress?: boolean;
  /** Affiche la poignée de glissement en haut. */
  showHandle?: boolean;
  /** Classes appliquées au panneau. */
  className?: string;
  children?: ReactNode;
}

/**
 * Feuille ancrée en bas d'écran, thémée, avec une animation d'entrée/sortie
 * (slide-up + fondu) et un démontage différé propre.
 *
 * Le contenu étant rendu dans une racine native séparée, les variables de
 * thème (dark/light) sont ré-injectées.
 */
export function BottomSheet({
  visible,
  onClose,
  title,
  dismissOnBackdropPress = true,
  showHandle = true,
  className,
  children,
}: BottomSheetProps) {
  const themeVars = useThemeVars();
  const progress = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.spring(progress, {
        toValue: 1,
        useNativeDriver: false,
        friction: 9,
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

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [32, 0],
  });

  return (
    <RNModal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={themeVars} className="flex-1">
        <Animated.View style={{ flex: 1, opacity: progress }}>
          <Pressable
            className="flex-1 justify-end bg-black/50"
            onPress={dismissOnBackdropPress ? onClose : undefined}
          >
            <Animated.View style={{ transform: [{ translateY }] }}>
              <Pressable
                onPress={(e) => e.stopPropagation()}
                className={cn(
                  'max-h-[80%] rounded-t-2xl border-t border-border bg-card pb-8',
                  className
                )}
              >
                {showHandle ? (
                  <View className="mt-3 h-1 w-10 self-center rounded-full bg-muted" />
                ) : null}
                {title ? (
                  <Text variant="h4" className="px-4 pb-2 pt-3 text-card-foreground">
                    {title}
                  </Text>
                ) : null}
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  className="px-2"
                  contentContainerClassName="pt-2"
                >
                  {children}
                </ScrollView>
              </Pressable>
            </Animated.View>
          </Pressable>
        </Animated.View>
      </View>
    </RNModal>
  );
}
