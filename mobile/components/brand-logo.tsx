import { Image } from 'expo-image';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { COLORS } from '@/constants/ui';

const LOGO = require('@/assets/images/logo-studio-ge.png');

// Logo do Studio Geração Energia (specs/identidade-visual.md).
// Com anel branco quando aparece sobre o marinho do cabeçalho.
export function BrandLogo({ size = 34, anel = true }: { size?: number; anel?: boolean }) {
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel="Studio Geração Energia"
      style={[styles.wrap, { borderRadius: size / 2, height: size, width: size }, anel && styles.anel]}>
      <Image source={LOGO} style={{ height: size, width: size }} contentFit="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  anel: { backgroundColor: COLORS.white, borderColor: COLORS.white, borderWidth: 2 },
});
