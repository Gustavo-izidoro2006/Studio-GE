import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';

import { HeaderTitle } from '@/components/header-title';
import { TabBar } from '@/components/tab-bar';
import { COLORS } from '@/constants/ui';

// Abas principais. A barra é própria (components/tab-bar.tsx) e o cabeçalho
// não tem ícones sem ação (specs/acabamento-visual-v012.md, G1 e G2).
export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'center',
        headerTintColor: COLORS.blue,
        headerTitleStyle: styles.headerTitle,
        headerStyle: styles.header,
        headerShadowVisible: false,
        // Título + perfil ativo (specs/perfis.md); na própria aba Perfil não repete.
        headerTitle: ({ children }) => <HeaderTitle title={children} />,
      }}>
      <Tabs.Screen name="index" options={{ title: 'Alunos' }} />
      <Tabs.Screen name="exercicios" options={{ title: 'Exercícios' }} />
      <Tabs.Screen name="treinos" options={{ title: 'Treinos' }} />
      <Tabs.Screen name="financeiro" options={{ title: 'Financeiro' }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil', headerTitle: ({ children }) => <HeaderTitle title={children} mostrarPerfil={false} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: COLORS.white,
    borderBottomColor: '#E4E7EA',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    color: COLORS.blue,
    fontSize: 18,
    fontWeight: '700',
  },
});
