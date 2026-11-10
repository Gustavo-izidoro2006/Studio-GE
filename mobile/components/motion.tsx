import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import Animated, { FadeInDown, ReduceMotion } from 'react-native-reanimated';

import { MOTION } from '@/constants/ui';

// Animações de entrada (specs/acabamento-visual-v012.md, G6).
// Todas respeitam "remover animações" do sistema (ReduceMotion.System).

type Props = { children: React.ReactNode; style?: StyleProp<ViewStyle> };

/** Conteúdo entra com fade e leve subida. */
export function FadeInView({ children, style, delay = 0 }: Props & { delay?: number }) {
  return (
    <Animated.View
      entering={FadeInDown.duration(MOTION.base).delay(delay).reduceMotion(ReduceMotion.System)}
      style={style}>
      {children}
    </Animated.View>
  );
}

/**
 * Item de lista em cascata. Só os primeiros itens animam; os demais (inclusive os que
 * aparecem ao rolar uma lista longa) entram na hora, sem atraso.
 */
export function StaggerItem({ children, style, index }: Props & { index: number }) {
  if (index >= MOTION.staggerMax) return <View style={style}>{children}</View>;
  const delay = index * MOTION.stagger;
  return (
    <Animated.View
      entering={FadeInDown.duration(MOTION.base).delay(delay).reduceMotion(ReduceMotion.System)}
      style={style}>
      {children}
    </Animated.View>
  );
}
