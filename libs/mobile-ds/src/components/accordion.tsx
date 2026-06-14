import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Animated, Pressable, View } from 'react-native';
import { CaretDown } from 'phosphor-react-native';

import { cn } from '../utils/cn';
import { Text } from './text';
import { useTheme } from '../theme/theme-provider';
import { channelsToRgb } from '../utils/color';

interface AccordionContextValue {
  isOpen: (value: string) => boolean;
  toggle: (value: string) => void;
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

export interface AccordionProps {
  /** `single` : une section ouverte à la fois ; `multiple` : plusieurs. */
  type?: 'single' | 'multiple';
  /** Valeur(s) ouverte(s) au départ. */
  defaultValue?: string | string[];
  className?: string;
  children: ReactNode;
}

/** Conteneur de sections repliables. */
export function Accordion({
  type = 'single',
  defaultValue,
  className,
  children,
}: AccordionProps) {
  const [openValues, setOpenValues] = useState<string[]>(
    defaultValue == null ? [] : Array.isArray(defaultValue) ? defaultValue : [defaultValue]
  );

  const isOpen = (value: string) => openValues.includes(value);
  const toggle = (value: string) => {
    setOpenValues((current) => {
      const alreadyOpen = current.includes(value);
      if (type === 'single') {
        return alreadyOpen ? [] : [value];
      }
      return alreadyOpen
        ? current.filter((v) => v !== value)
        : [...current, value];
    });
  };

  return (
    <AccordionContext.Provider value={{ isOpen, toggle }}>
      <View
        className={cn(
          'overflow-hidden rounded-xl border border-border bg-card',
          className
        )}
      >
        {children}
      </View>
    </AccordionContext.Provider>
  );
}

export interface AccordionItemProps {
  /** Identifiant unique de la section. */
  value: string;
  /** Titre affiché dans l'en-tête. */
  title: string;
  children: ReactNode;
}

/** Section repliable d'un `Accordion`. */
export function AccordionItem({ value, title, children }: AccordionItemProps) {
  const ctx = useContext(AccordionContext);
  if (!ctx) {
    throw new Error('AccordionItem doit être utilisé dans un <Accordion>.');
  }
  const { colors } = useTheme();
  const open = ctx.isOpen(value);

  const [contentHeight, setContentHeight] = useState(0);
  const progress = useRef(new Animated.Value(open ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: open ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [open, progress]);

  const animatedHeight = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, contentHeight],
  });
  const rotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View className="border-b border-border">
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => ctx.toggle(value)}
        className="flex-row items-center justify-between px-4 py-4 active:bg-accent"
      >
        <Text variant="body" weight="medium" className="flex-1 pr-2">
          {title}
        </Text>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <CaretDown size={18} color={channelsToRgb(colors.mutedForeground)} />
        </Animated.View>
      </Pressable>

      <Animated.View
        style={{
          height: contentHeight > 0 ? animatedHeight : open ? undefined : 0,
          overflow: 'hidden',
        }}
      >
        {/* Mesure la hauteur naturelle du contenu (clippée par le parent). */}
        <View
          style={{ position: contentHeight > 0 ? 'absolute' : 'relative', left: 0, right: 0 }}
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            if (h > 0 && h !== contentHeight) setContentHeight(h);
          }}
        >
          <View className="px-4 pb-4">{children}</View>
        </View>
      </Animated.View>
    </View>
  );
}
