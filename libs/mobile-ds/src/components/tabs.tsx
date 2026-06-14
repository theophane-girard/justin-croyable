import {
  Children,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { Animated, Pressable, View } from 'react-native';

import { cn } from '../utils/cn';
import { Text } from './text';
import { useTheme } from '../theme/theme-provider';
import { channelsToRgb } from '../utils/color';

interface TabsContextValue {
  value: string;
  setValue: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs(): TabsContextValue {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('Les sous-composants Tabs doivent être dans <Tabs>.');
  return ctx;
}

export interface TabsProps {
  /** Valeur contrôlée. */
  value?: string;
  /** Valeur initiale (non contrôlé). */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children: ReactNode;
}

/** Conteneur d'onglets (contrôlé ou non). */
export function Tabs({
  value,
  defaultValue,
  onValueChange,
  className,
  children,
}: TabsProps) {
  const [internal, setInternal] = useState(defaultValue ?? '');
  const current = value ?? internal;

  const setValue = (v: string) => {
    if (value === undefined) setInternal(v);
    onValueChange?.(v);
  };

  return (
    <TabsContext.Provider value={{ value: current, setValue }}>
      <View className={className}>{children}</View>
    </TabsContext.Provider>
  );
}

export interface TabsTriggerProps {
  value: string;
  label: string;
}

/** Onglet cliquable. */
export function TabsTrigger({ value, label }: TabsTriggerProps) {
  const { value: active, setValue } = useTabs();
  const isActive = active === value;
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      onPress={() => setValue(value)}
      className="flex-1 items-center py-2.5"
    >
      <Text
        variant="small"
        weight="medium"
        className={isActive ? 'text-primary' : 'text-muted-foreground'}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export interface TabsListProps {
  className?: string;
  children: ReactNode;
}

/** Barre d'onglets avec indicateur animé qui glisse sous l'onglet actif. */
export function TabsList({ className, children }: TabsListProps) {
  const { value } = useTabs();
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);

  const triggers = Children.toArray(children).filter(isValidElement) as ReactElement<TabsTriggerProps>[];
  const values = triggers.map((c) => c.props.value);
  const activeIndex = Math.max(0, values.indexOf(value));
  const count = triggers.length || 1;
  const segWidth = width / count;

  const pos = useRef(new Animated.Value(activeIndex)).current;
  useEffect(() => {
    Animated.spring(pos, {
      toValue: activeIndex,
      useNativeDriver: false,
      friction: 10,
      tension: 120,
    }).start();
  }, [activeIndex, pos]);

  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      className={cn('flex-row border-b border-border', className)}
    >
      {children}
      {width > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            bottom: 0,
            height: 2,
            width: segWidth,
            backgroundColor: channelsToRgb(colors.primary),
            transform: [{ translateX: Animated.multiply(pos, segWidth) }],
          }}
        />
      ) : null}
    </View>
  );
}

export interface TabsContentProps {
  value: string;
  className?: string;
  children: ReactNode;
}

/** Contenu associé à un onglet ; apparaît en fondu quand il devient actif. */
export function TabsContent({ value, className, children }: TabsContentProps) {
  const { value: active } = useTabs();
  const isActive = active === value;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isActive) {
      opacity.setValue(0);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [isActive, opacity]);

  if (!isActive) return null;

  return (
    <Animated.View style={{ opacity }} className={cn('pt-4', className)}>
      {children}
    </Animated.View>
  );
}
