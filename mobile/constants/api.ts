import Constants from 'expo-constants';

// Único lugar que decide o endereço do backend (ver specs/api-por-ambiente.md).
// - APK / build de distribuição: sempre a nuvem.
// - Desenvolvimento (Expo Go, emulador, web): o backend do mesmo computador que serve o app.
// - Opcional, só em desenvolvimento: EXPO_PUBLIC_API_URL em mobile/.env.local.

const API_NUVEM = 'https://studioge.pythonanywhere.com/api';
const PORTA_BACKEND_LOCAL = 8000;

function enderecoDoComputador() {
  // Ex.: hostUri = "192.168.100.52:8081" (Expo Go) ou "localhost:8081" (web/emulador).
  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri ? hostUri.split(':')[0] : 'localhost';
  return `http://${host}:${PORTA_BACKEND_LOCAL}/api`;
}

export const API_ROOT: string = __DEV__
  ? process.env.EXPO_PUBLIC_API_URL || enderecoDoComputador()
  : API_NUVEM;

/** Acrescenta o perfil ativo à URL (?perfil=<id>). Sem perfil, a API usa Academia (specs/perfis.md). */
export function comPerfil(url: string, perfilId: number | null | undefined) {
  if (!perfilId) return url;
  return `${url}${url.includes('?') ? '&' : '?'}perfil=${perfilId}`;
}
