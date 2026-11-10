import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS, RADIUS } from '@/constants/ui';
import { PERFIL_ICON, usePerfil } from '@/contexts/perfil';

// Título da aba + perfil ativo logo abaixo (specs/perfis.md). Tocar no perfil leva à aba Perfil.
export function HeaderTitle({ title, mostrarPerfil = true }: { title: string; mostrarPerfil?: boolean }) {
  const { perfil } = usePerfil();
  return (
    <View style={styles.wrap}>
      <Text accessibilityRole="header" style={styles.title} numberOfLines={1}>{title}</Text>
      {mostrarPerfil && perfil ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Perfil ativo: ${perfil.nome}. Trocar perfil`}
          hitSlop={{ top: 6, bottom: 6, left: 12, right: 12 }}
          onPress={() => router.navigate('/perfil')}
          style={styles.chip}>
          <MaterialIcons name={PERFIL_ICON[perfil.tipo]} size={13} color={COLORS.blueDark} />
          <Text style={styles.chipText} numberOfLines={1}>{perfil.nome}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', maxWidth: 240 },
  title: { color: COLORS.blue, fontSize: 18, fontWeight: '700' },
  chip: { alignItems: 'center', backgroundColor: COLORS.blueLight, borderRadius: RADIUS.pill, flexDirection: 'row', gap: 4, marginTop: 2, maxWidth: 220, paddingHorizontal: 8, paddingVertical: 1 },
  chipText: { color: COLORS.blueDark, fontSize: 12, fontWeight: '600' },
});
