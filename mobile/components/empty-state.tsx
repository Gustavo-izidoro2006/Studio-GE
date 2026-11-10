import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FadeInView } from '@/components/motion';
import { PressableScale } from '@/components/pressable-scale';
import { COLORS, RADIUS, TOUCH } from '@/constants/ui';

type Props = {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  title: string;
  text?: string;
  actionLabel?: string;
  onAction?: () => void;
};

// Estado vazio: um convite, não um pedido de desculpas (G3).
export function EmptyState({ icon, title, text, actionLabel, onAction }: Props) {
  return (
    <FadeInView style={styles.box}>
      <View style={styles.iconCircle}>
        <MaterialIcons name={icon} size={34} color={COLORS.blue} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {text ? <Text style={styles.text}>{text}</Text> : null}
      {actionLabel && onAction ? (
        <PressableScale accessibilityRole="button" onPress={onAction} style={styles.action}>
          <MaterialIcons name="add" size={20} color={COLORS.white} />
          <Text style={styles.actionText}>{actionLabel}</Text>
        </PressableScale>
      ) : null}
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: 'center', paddingHorizontal: 28, paddingVertical: 40 },
  iconCircle: { alignItems: 'center', backgroundColor: COLORS.blueLight, borderRadius: 36, height: 72, justifyContent: 'center', marginBottom: 16, width: 72 },
  title: { color: COLORS.text, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  text: { color: COLORS.muted, fontSize: 15, lineHeight: 21, marginTop: 6, textAlign: 'center' },
  action: { alignItems: 'center', backgroundColor: COLORS.blue, borderRadius: RADIUS.pill, flexDirection: 'row', gap: 6, marginTop: 20, minHeight: TOUCH, paddingHorizontal: 20 },
  actionText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
});
