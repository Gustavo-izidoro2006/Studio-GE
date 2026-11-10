import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/constants/ui';

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return '?';
  const primeira = partes[0][0];
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (primeira + ultima).toUpperCase();
}

// Círculo com as iniciais do aluno (G5). Decorativo: o nome sempre aparece ao lado.
export function Avatar({ nome, size = 44 }: { nome: string; size?: number }) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.circle, { borderRadius: size / 2, height: size, width: size }]}>
      <Text style={[styles.text, { fontSize: size * 0.38 }]}>{iniciais(nome)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', backgroundColor: COLORS.blueLight, justifyContent: 'center' },
  text: { color: COLORS.blueDark, fontWeight: '700' },
});
