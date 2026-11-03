import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';

// Altura original da barra (ícones + rótulos); o inset do sistema é somado a ela.
const TAB_BAR_HEIGHT = 68;
const TAB_BAR_PADDING_BOTTOM = 6;

const COLORS = {
  active: '#185FA5',
  accent: '#EF9F27',
  background: '#FFFFFF',
  inactive: '#7A828A',
};

function TabIcon({ name, label, focused }: { name: React.ComponentProps<typeof MaterialIcons>['name']; label: string; focused: boolean }) {
  return (
    <View style={styles.tabItem}>
      <MaterialIcons name={name} size={24} color={focused ? COLORS.active : COLORS.inactive} />
      <View style={styles.tabLabelContainer}>
        <Text style={[styles.tabLabel, { color: focused ? COLORS.active : COLORS.inactive }]}>{label}</Text>
        {focused && <View style={styles.activeIndicator} />}
      </View>
    </View>
  );
}

function HeaderIcon({ name }: { name: React.ComponentProps<typeof MaterialIcons>['name'] }) {
  return (
    <Pressable accessibilityRole="button" style={styles.headerButton}>
      <MaterialIcons name={name} size={24} color={COLORS.active} />
    </Pressable>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'center',
        headerTintColor: COLORS.active,
        headerTitleStyle: styles.headerTitle,
        headerStyle: styles.header,
        tabBarActiveTintColor: COLORS.active,
        tabBarInactiveTintColor: COLORS.inactive,
        tabBarStyle: [styles.tabBar, { height: TAB_BAR_HEIGHT + insets.bottom, paddingBottom: TAB_BAR_PADDING_BOTTOM + insets.bottom }],
        tabBarShowLabel: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Alunos',
          tabBarAccessibilityLabel: 'Alunos',
          tabBarIcon: ({ focused }) => <TabIcon name="people" label="Alunos" focused={focused} />,
          headerLeft: () => <HeaderIcon name="menu" />,
          headerRight: () => <HeaderIcon name="add" />,
        }}
      />
      <Tabs.Screen
        name="exercicios"
        options={{
          title: 'Exercícios',
          tabBarAccessibilityLabel: 'Exercícios',
          tabBarIcon: ({ focused }) => <TabIcon name="fitness-center" label="Exercícios" focused={focused} />,
          headerLeft: () => <HeaderIcon name="menu" />,
          headerRight: () => <HeaderIcon name="add" />,
        }}
      />
      <Tabs.Screen
        name="treinos"
        options={{
          title: 'Treinos',
          tabBarAccessibilityLabel: 'Treinos',
          tabBarIcon: ({ focused }) => <TabIcon name="event-note" label="Treinos" focused={focused} />,
          headerLeft: () => <HeaderIcon name="menu" />,
          headerRight: () => <HeaderIcon name="add" />,
        }}
      />
      <Tabs.Screen
        name="financeiro"
        options={{
          title: 'Financeiro',
          tabBarAccessibilityLabel: 'Financeiro',
          tabBarIcon: ({ focused }) => <TabIcon name="attach-money" label="Financeiro" focused={focused} />,
          headerLeft: () => <HeaderIcon name="menu" />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarAccessibilityLabel: 'Perfil',
          tabBarIcon: ({ focused }) => <TabIcon name="person" label="Perfil" focused={focused} />,
          headerLeft: () => <HeaderIcon name="menu" />,
          headerRight: () => <HeaderIcon name="edit" />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  activeIndicator: {
    backgroundColor: COLORS.accent,
    height: 3,
    marginTop: 3,
  },
  header: {
    backgroundColor: COLORS.background,
  },
  headerButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 52,
  },
  headerTitle: {
    color: COLORS.active,
    fontSize: 18,
    fontWeight: '700',
  },
  tabItem: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  tabLabelContainer: {
    alignItems: 'stretch',
    alignSelf: 'center',
    marginTop: 2,
  },
  tabBar: {
    backgroundColor: COLORS.background,
    borderTopColor: '#E4E7EA',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 5,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});
