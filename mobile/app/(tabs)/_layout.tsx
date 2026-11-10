import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { BrandLogo } from '@/components/brand-logo';
import { HeaderTitle } from '@/components/header-title';
import { TabBar } from '@/components/tab-bar';
import { COLORS } from '@/constants/ui';

// Abas principais. Cabeçalho marinho com o logo do Studio nos três perfis
// (specs/identidade-visual.md); barra de abas própria (components/tab-bar.tsx).
export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'center',
        headerTintColor: COLORS.white,
        headerStyle: styles.header,
        headerShadowVisible: false,
        headerTitle: ({ children }) => <HeaderTitle title={children} />,
        headerLeft: () => <View style={styles.logoSlot}><BrandLogo size={36} /></View>,
        headerLeftContainerStyle: styles.side,
        headerRightContainerStyle: styles.side,
      }}>
      <Tabs.Screen name="index" options={{ title: 'Alunos' }} />
      <Tabs.Screen name="exercicios" options={{ title: 'Exercícios' }} />
      <Tabs.Screen name="treinos" options={{ title: 'Treinos' }} />
      <Tabs.Screen name="financeiro" options={{ title: 'Financeiro' }} />
      {/* Na aba Perfil o logo já está grande na capa: não repete no cabeçalho. */}
      <Tabs.Screen name="perfil" options={{ title: 'Perfil', headerLeft: () => null, headerTitle: ({ children }) => <HeaderTitle title={children} mostrarPerfil={false} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: COLORS.blue },
  logoSlot: { paddingLeft: 14 },
  side: { minWidth: 64 },
});
