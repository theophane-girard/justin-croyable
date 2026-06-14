import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Animated, Pressable, View } from 'react-native';
import { CheckCircle, WarningCircle, Info, X, type Icon } from 'phosphor-react-native';

import { Text } from './text';
import { useTheme } from '../theme/theme-provider';
import { channelsToRgb } from '../utils/color';
import type { ThemeColors } from '../theme/tokens';

export type ToastVariant = 'default' | 'success' | 'destructive' | 'info';

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  /** Durée d'affichage en ms (0 = persistant). Défaut 3000. */
  duration?: number;
}

interface ToastEntry extends ToastOptions {
  id: number;
}

interface ToastContextValue {
  /** Affiche un toast. */
  toast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const variantConfig: Record<ToastVariant, { icon: Icon; color: keyof ThemeColors }> = {
  default: { icon: Info, color: 'foreground' },
  success: { icon: CheckCircle, color: 'success' },
  destructive: { icon: WarningCircle, color: 'destructive' },
  info: { icon: Info, color: 'primary' },
};

/** Fournit le contexte des toasts et rend leur overlay. À placer sous `ThemeProvider`. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const counter = useRef(0);

  const toast = useCallback((options: ToastOptions) => {
    counter.current += 1;
    const id = counter.current;
    setToasts((current) => [...current, { id, ...options }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <View
        pointerEvents="box-none"
        className="absolute left-0 right-0 top-12 gap-2 px-4"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

/** Accède à la fonction `toast()`. À utiliser sous `ToastProvider`. */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast doit être utilisé à l’intérieur d’un <ToastProvider>.');
  }
  return ctx;
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastEntry;
  onDismiss: (id: number) => void;
}) {
  const { colors } = useTheme();
  const progress = useRef(new Animated.Value(0)).current;
  const config = variantConfig[toast.variant ?? 'default'];
  const IconComponent = config.icon;

  const close = useCallback(() => {
    Animated.timing(progress, {
      toValue: 0,
      duration: 150,
      useNativeDriver: false,
    }).start((result) => {
      if (result?.finished) onDismiss(toast.id);
    });
  }, [progress, onDismiss, toast.id]);

  useEffect(() => {
    Animated.spring(progress, {
      toValue: 1,
      useNativeDriver: false,
      friction: 8,
      tension: 100,
    }).start();

    const ms = toast.duration ?? 3000;
    if (ms > 0) {
      const timer = setTimeout(close, ms);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [progress, close, toast.duration]);

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-16, 0],
  });

  return (
    <Animated.View
      pointerEvents="auto"
      style={{ opacity: progress, transform: [{ translateY }] }}
    >
      <View className="flex-row items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-lg">
        <IconComponent
          size={22}
          weight="fill"
          color={channelsToRgb(colors[config.color])}
        />
        <View className="flex-1">
          <Text variant="small" weight="semibold" className="text-card-foreground">
            {toast.title}
          </Text>
          {toast.description ? (
            <Text variant="caption" tone="muted">
              {toast.description}
            </Text>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fermer"
          onPress={close}
          hitSlop={8}
        >
          <X size={18} color={channelsToRgb(colors.mutedForeground)} />
        </Pressable>
      </View>
    </Animated.View>
  );
}
