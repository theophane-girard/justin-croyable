import { useCallback, useRef, useState } from 'react';
import { PanResponder, View, type GestureResponderEvent } from 'react-native';

import { cn } from '../utils/cn';

const THUMB = 24;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
function snap(value: number, step: number, min: number, max: number): number {
  const snapped = Math.round((value - min) / step) * step + min;
  return clamp(snapped, min, max);
}

interface SliderBaseProps {
  minimumValue?: number;
  maximumValue?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
}

function Thumb({ left }: { left: number }) {
  return (
    <View
      pointerEvents="none"
      className="absolute h-6 w-6 rounded-full border border-border bg-background shadow"
      style={{
        left,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
        elevation: 2,
      }}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Slider (valeur unique)                                                       */
/* -------------------------------------------------------------------------- */

export interface SliderProps extends SliderBaseProps {
  value: number;
  onValueChange?: (value: number) => void;
}

/** Curseur de sélection d'une valeur, déplaçable au doigt. */
export function Slider({
  value,
  onValueChange,
  minimumValue = 0,
  maximumValue = 100,
  step = 1,
  disabled = false,
  className,
}: SliderProps) {
  const [width, setWidth] = useState(0);
  const trackRef = useRef<View>(null);
  const leftRef = useRef(0);

  // Les handlers du PanResponder sont figés : on lit les valeurs courantes via refs.
  const cfg = useRef({ minimumValue, maximumValue, step, disabled, onValueChange, width });
  cfg.current = { minimumValue, maximumValue, step, disabled, onValueChange, width };

  const updateFromPageX = useCallback((pageX: number) => {
    const c = cfg.current;
    if (c.disabled || c.width <= 0) return;
    const ratio = clamp((pageX - leftRef.current) / c.width, 0, 1);
    const raw = c.minimumValue + ratio * (c.maximumValue - c.minimumValue);
    c.onValueChange?.(snap(raw, c.step, c.minimumValue, c.maximumValue));
  }, []);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e: GestureResponderEvent) =>
        updateFromPageX(e.nativeEvent.pageX),
      onPanResponderMove: (e: GestureResponderEvent) =>
        updateFromPageX(e.nativeEvent.pageX),
    })
  ).current;

  const ratio =
    maximumValue > minimumValue
      ? clamp((value - minimumValue) / (maximumValue - minimumValue), 0, 1)
      : 0;
  const thumbLeft = clamp(ratio * width - THUMB / 2, 0, Math.max(0, width - THUMB));

  return (
    <View
      {...pan.panHandlers}
      className={cn('justify-center', disabled && 'opacity-50', className)}
      style={{ height: THUMB }}
    >
      <View
        ref={trackRef}
        onLayout={(e) => {
          setWidth(e.nativeEvent.layout.width);
          trackRef.current?.measureInWindow((x) => {
            leftRef.current = x;
          });
        }}
        className="h-1.5 justify-center rounded-full bg-muted"
      >
        <View
          pointerEvents="none"
          className="h-1.5 rounded-full bg-primary"
          style={{ width: ratio * width }}
        />
      </View>
      <Thumb left={thumbLeft} />
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* RangeSlider (plage : deux valeurs)                                           */
/* -------------------------------------------------------------------------- */

export interface RangeSliderProps extends SliderBaseProps {
  values: [number, number];
  onValuesChange?: (values: [number, number]) => void;
}

/** Curseur de sélection d'une plage (deux poignées). */
export function RangeSlider({
  values,
  onValuesChange,
  minimumValue = 0,
  maximumValue = 100,
  step = 1,
  disabled = false,
  className,
}: RangeSliderProps) {
  const [width, setWidth] = useState(0);
  const trackRef = useRef<View>(null);
  const leftRef = useRef(0);
  const activeThumb = useRef<0 | 1>(0);

  const cfg = useRef({ minimumValue, maximumValue, step, disabled, onValuesChange, width, values });
  cfg.current = { minimumValue, maximumValue, step, disabled, onValuesChange, width, values };

  const valueFromPageX = useCallback((pageX: number) => {
    const c = cfg.current;
    const ratio = clamp((pageX - leftRef.current) / c.width, 0, 1);
    const raw = c.minimumValue + ratio * (c.maximumValue - c.minimumValue);
    return snap(raw, c.step, c.minimumValue, c.maximumValue);
  }, []);

  const onGrant = useCallback(
    (e: GestureResponderEvent) => {
      const c = cfg.current;
      if (c.disabled || c.width <= 0) return;
      const v = valueFromPageX(e.nativeEvent.pageX);
      // Poignée la plus proche du point touché.
      activeThumb.current =
        Math.abs(v - c.values[0]) <= Math.abs(v - c.values[1]) ? 0 : 1;
      applyValue(v);
    },
    [valueFromPageX]
  );

  const applyValue = (v: number) => {
    const c = cfg.current;
    const [low, high] = c.values;
    if (activeThumb.current === 0) {
      c.onValuesChange?.([Math.min(v, high), high]);
    } else {
      c.onValuesChange?.([low, Math.max(v, low)]);
    }
  };

  const onMove = useCallback(
    (e: GestureResponderEvent) => {
      const c = cfg.current;
      if (c.disabled || c.width <= 0) return;
      applyValue(valueFromPageX(e.nativeEvent.pageX));
    },
    [valueFromPageX]
  );

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: onGrant,
      onPanResponderMove: onMove,
    })
  ).current;

  const span = maximumValue - minimumValue || 1;
  const lowRatio = clamp((values[0] - minimumValue) / span, 0, 1);
  const highRatio = clamp((values[1] - minimumValue) / span, 0, 1);

  return (
    <View
      {...pan.panHandlers}
      className={cn('justify-center', disabled && 'opacity-50', className)}
      style={{ height: THUMB }}
    >
      <View
        ref={trackRef}
        onLayout={(e) => {
          setWidth(e.nativeEvent.layout.width);
          trackRef.current?.measureInWindow((x) => {
            leftRef.current = x;
          });
        }}
        className="h-1.5 justify-center rounded-full bg-muted"
      >
        <View
          pointerEvents="none"
          className="absolute h-1.5 rounded-full bg-primary"
          style={{ left: lowRatio * width, width: (highRatio - lowRatio) * width }}
        />
      </View>
      <Thumb left={clamp(lowRatio * width - THUMB / 2, 0, Math.max(0, width - THUMB))} />
      <Thumb left={clamp(highRatio * width - THUMB / 2, 0, Math.max(0, width - THUMB))} />
    </View>
  );
}
