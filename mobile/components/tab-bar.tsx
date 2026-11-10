import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, MOTION } from '@/constants/ui';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

// Ícone de cada aba pelo nome do arquivo da rota.
const ICONS: Record<string, IconName> = {
  index: 'people',
  exercicios: 'fitness-center',
  treinos: 'event-note',
  financeiro: 'attach-money',
  perfil: 'person',
};

const BAR_HEIGHT = 64;

function TabItem({ label, icon, focused, onPress, onLongPress }: {
  label: string;
  icon: IconName;
  focused: boolean;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(focused ? 1 : 0);
  const iconScale = useSharedValue(1);

  useEffect(() => {
    progress.value = reduceMotion ? (focused ? 1 : 0) : withTiming(focused ? 1 : 0, { duration: MOTION.base });
    if (focused && !reduceMotion) {
      iconScale.value = withSequence(withSpring(1.14, { damping: 10, stiffness: 400 }), withSpring(1, { damping: 12, stiffness: 260 }));
    }
  }, [focused, reduceMotion, progress, iconScale]);

  // A pílula sempre ocupa o mesmo espaço; só a opacidade e a largura mudam (nada "sobe").
  const pillStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scaleX: 0.55 + progress.value * 0.45 }],
  }));
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: iconScale.value }] }));

  const color = focused ? COLORS.blue : COLORS.muted;

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      onPress={onPress}
      onLongPress={onLongPress}
      android_ripple={{ color: 'transparent' }}
      style={styles.item}>
      <View style={styles.iconSlot}>
        <Animated.View style={[styles.pill, pillStyle]} />
        <Animated.View style={iconStyle}>
          <MaterialIcons name={icon} size={24} color={color} />
        </Animated.View>
      </View>
      <Text
        numberOfLines={1}
        maxFontSizeMultiplier={1.2}
        style={[styles.label, { color, fontWeight: focused ? '700' : '600' }]}>
        {label}
      </Text>
    </Pressable>
  );
}

// Barra de abas própria (specs/acabamento-visual-v012.md, G1): nomes inteiros, sem deslocamento ao tocar.
export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View accessibilityRole="tablist" style={[styles.bar, { height: BAR_HEIGHT + insets.bottom, paddingBottom: insets.bottom }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = typeof options.tabBarLabel === 'string' ? options.tabBarLabel : options.title ?? route.name;
        const focused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            if (Platform.OS !== 'web') void Haptics.selectionAsync();
            navigation.navigate(route.name, route.params);
          }
        };
        const onLongPress = () => navigation.emit({ type: 'tabLongPress', target: route.key });

        return (
          <TabItem
            key={route.key}
            label={label}
            icon={ICONS[route.name] ?? 'circle'}
            focused={focused}
            onPress={onPress}
            onLongPress={onLongPress}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: COLORS.white,
    borderTopColor: COLORS.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    paddingTop: 6,
  },
  item: { alignItems: 'center', flex: 1, justifyContent: 'flex-start', minHeight: 44, paddingHorizontal: 2 },
  iconSlot: { alignItems: 'center', height: 32, justifyContent: 'center', width: 60 },
  pill: { backgroundColor: COLORS.limePill, borderRadius: 16, height: 32, position: 'absolute', width: 60 },
  label: { fontSize: 12, marginTop: 3, textAlign: 'center' },
});
