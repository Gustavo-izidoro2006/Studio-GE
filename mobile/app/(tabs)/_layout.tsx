import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';

const COLORS = {
  active: '#185FA5',
  accent: '#EF9F27',
  background: '#FFFFFF',
  inactive: '#7A828A',
};

function TabIcon({ name, focused }: { name: React.ComponentProps<typeof MaterialIcons>['name']; focused: boolean }) {
  return (
    <View style={styles.iconSlot}>
      <MaterialIcons name={name} size={24} color={focused ? COLORS.active : COLORS.inactive} />
      {focused && <View style={styles.activeIndicator} />}
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
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Alunos',
          tabBarIcon: ({ focused }) => <TabIcon name="people" focused={focused} />,
          headerLeft: () => <HeaderIcon name="menu" />,
          headerRight: () => <HeaderIcon name="add" />,
        }}
      />
      <Tabs.Screen
        name="exercicios"
        options={{
          title: 'Exercícios',
          tabBarIcon: ({ focused }) => <TabIcon name="fitness-center" focused={focused} />,
          headerLeft: () => <HeaderIcon name="menu" />,
          headerRight: () => <HeaderIcon name="add" />,
        }}
      />
      <Tabs.Screen
        name="treinos"
        options={{
          title: 'Treinos',
          tabBarIcon: ({ focused }) => <TabIcon name="event-note" focused={focused} />,
          headerLeft: () => <HeaderIcon name="menu" />,
          headerRight: () => <HeaderIcon name="add" />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ focused }) => <TabIcon name="person" focused={focused} />,
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
    bottom: -8,
    height: 3,
    left: 0,
    position: 'absolute',
    right: 0,
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
  iconSlot: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
    position: 'relative',
    width: 48,
  },
  tabBar: {
    backgroundColor: COLORS.background,
    borderTopColor: '#E4E7EA',
    borderTopWidth: StyleSheet.hairlineWidth,
    height: 68,
    paddingBottom: 6,
    paddingTop: 5,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
});
