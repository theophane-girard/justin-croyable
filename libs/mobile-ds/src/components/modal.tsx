import type { ReactNode } from 'react';
import {
  Modal as RNModal,
  Pressable,
  View,
  type ModalProps as RNModalProps,
} from 'react-native';

import { cn } from '../utils/cn';
import { Text } from './text';
import { useThemeVars } from '../theme/theme-provider';

export interface ModalProps
  extends Omit<RNModalProps, 'visible' | 'onRequestClose'> {
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

/** Modale centrée avec fond assombri, thémée via les tokens du Design System. */
export function Modal({
  visible,
  onClose,
  title,
  dismissOnBackdropPress = true,
  className,
  children,
  ...props
}: ModalProps) {
  // Le contenu est rendu dans une racine native séparée : on ré-injecte les
  // variables de thème pour qu'il reste correctement stylé (dark/light inclus).
  const themeVars = useThemeVars();

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      {...props}
    >
      <View style={themeVars} className="flex-1">
        <Pressable
          className="flex-1 items-center justify-center bg-black/50 p-6"
          onPress={dismissOnBackdropPress ? onClose : undefined}
        >
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
        </Pressable>
      </View>
    </RNModal>
  );
}
