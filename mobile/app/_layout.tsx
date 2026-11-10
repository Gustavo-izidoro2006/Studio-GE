import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { PerfilProvider } from '@/contexts/perfil';
import { COLORS } from '@/constants/ui';

export const unstable_settings = {
  anchor: '(tabs)',
};

// O app tem um único tema, claro, com as cores do Studio (specs/identidade-visual.md):
// assim o modo escuro do celular não escurece só parte da navegação.
const TEMA = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, primary: COLORS.blue, background: COLORS.background, card: COLORS.blue, text: COLORS.text, border: COLORS.border },
};

export default function RootLayout() {
  return (
    <ThemeProvider value={TEMA}>
      <PerfilProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
      </PerfilProvider>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
