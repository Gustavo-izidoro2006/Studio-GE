import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';

import { PressableScale } from '@/components/pressable-scale';
import { COLORS, RADIUS, SHADOW } from '@/constants/ui';

type Props = {
  accessibilityLabel: string;
  onPress: () => void;
  /** Com texto vira botão estendido (ícone + texto). */
  label?: string;
  icon?: React.ComponentProps<typeof MaterialIcons>['name'];
  style?: StyleProp<ViewStyle>;
  /** Distância extra do fundo (ex.: área do sistema). */
  bottomOffset?: number;
};

// Altura reservada no fim das listas para o botão nunca cobrir o último item.
export const FAB_SPACE = 96;

// Botão flutuante padrão do app (G3): redondo com "+" ou estendido com texto.
export function Fab({ accessibilityLabel, onPress, label, icon = 'add', style, bottomOffset = 0 }: Props) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      pressedScale={0.94}
      style={[styles.fab, label ? styles.extended : styles.round, { bottom: 22 + bottomOffset }, style]}>
      <MaterialIcons name={icon} size={label ? 22 : 28} color={COLORS.white} />
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  fab: {
    ...SHADOW.floating,
    alignItems: 'center',
    backgroundColor: COLORS.blue,
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    right: 20,
  },
  round: { borderRadius: 28, height: 56, width: 56 },
  extended: { borderRadius: RADIUS.pill, gap: 8, height: 52, paddingHorizontal: 20 },
  label: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
});
