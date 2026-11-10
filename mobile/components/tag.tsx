import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { COLORS, RADIUS } from '@/constants/ui';

export type TagTone = 'neutral' | 'blue' | 'yellow' | 'green' | 'red';
type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

const TONES: Record<TagTone, { bg: string; fg: string }> = {
  neutral: { bg: '#EEF1F4', fg: COLORS.muted },
  blue: { bg: COLORS.blueLight, fg: COLORS.blueDark },
  yellow: { bg: COLORS.paleYellow, fg: COLORS.yellowText },
  green: { bg: COLORS.lightGreen, fg: COLORS.green },
  red: { bg: COLORS.lightRed, fg: COLORS.danger },
};

// Etiqueta com ícone + texto: a cor nunca carrega o significado sozinha (G4).
export function Tag({ label, icon, tone = 'neutral', style }: { label: string; icon?: IconName; tone?: TagTone; style?: StyleProp<ViewStyle> }) {
  const colors = TONES[tone];
  return (
    <View style={[styles.tag, { backgroundColor: colors.bg }, style]}>
      {icon ? <MaterialIcons name={icon} size={14} color={colors.fg} /> : null}
      <Text style={[styles.text, { color: colors.fg }]} numberOfLines={1}>{label}</Text>
    </View>
  );
}

// Ícones das etiquetas usadas em mais de uma tela.
export const TURNO_TAG: Record<string, { label: string; icon: IconName }> = {
  manha: { label: 'Manhã', icon: 'wb-sunny' },
  tarde: { label: 'Tarde', icon: 'wb-twilight' },
  noite: { label: 'Noite', icon: 'nights-stay' },
};

export const STATUS_TAG: Record<string, { label: string; icon: IconName; tone: TagTone }> = {
  pago: { label: 'Pago', icon: 'check-circle-outline', tone: 'green' },
  pendente: { label: 'A vencer', icon: 'schedule', tone: 'yellow' },
  atrasado: { label: 'Atrasado', icon: 'error-outline', tone: 'red' },
};

export const CATEGORIA_ICON: Record<string, IconName> = {
  aluguel: 'home',
  energia_agua: 'bolt',
  salarios: 'payments',
  equipamentos: 'fitness-center',
  manutencao: 'build',
  marketing: 'campaign',
  outros: 'more-horiz',
};

const styles = StyleSheet.create({
  tag: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: RADIUS.pill,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  text: { fontSize: 12, fontWeight: '600' },
});
