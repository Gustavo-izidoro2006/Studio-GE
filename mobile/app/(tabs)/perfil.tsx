import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { StaggerItem } from '@/components/motion';
import { PressableScale } from '@/components/pressable-scale';
import { Tag } from '@/components/tag';
import { COLORS, RADIUS, TOUCH } from '@/constants/ui';
import { PERFIL_DESCRICAO, PERFIL_ICON, Perfil, usePerfil } from '@/contexts/perfil';

// Aba Perfil: escolher e renomear os perfis de trabalho (specs/perfis.md).
export default function PerfilScreen() {
  const insets = useSafeAreaInsets();
  const { perfis, perfilId, carregando, erro, escolher, renomear, recarregar } = usePerfil();
  const [editando, setEditando] = useState<Perfil | null>(null);
  const [nome, setNome] = useState('');
  const [salvando, setSalvando] = useState(false);

  // Atualiza a quantidade de alunos sempre que a aba é aberta.
  useFocusEffect(useCallback(() => { void recarregar(); }, [recarregar]));

  function selecionar(perfil: Perfil) {
    if (perfil.id === perfilId) return;
    if (Platform.OS !== 'web') void Haptics.selectionAsync();
    escolher(perfil.id);
  }

  function abrirRenomear(perfil: Perfil) {
    setNome(perfil.nome);
    setEditando(perfil);
  }

  async function salvarNome() {
    if (!editando) return;
    const novo = nome.trim();
    if (!novo) {
      Alert.alert('Nome obrigatório', 'Informe um nome para o perfil.');
      return;
    }
    setSalvando(true);
    try {
      await renomear(editando.id, novo);
      setEditando(null);
    } catch (falha) {
      Alert.alert('Erro', falha instanceof Error ? falha.message : 'Não foi possível renomear o perfil.');
    } finally {
      setSalvando(false);
    }
  }

  if (carregando && !perfis.length) {
    return <View style={styles.center}><ActivityIndicator color={COLORS.blue} size="large" /></View>;
  }

  if (erro && !perfis.length) {
    return (
      <View style={styles.center}>
        <MaterialIcons name="cloud-off" size={42} color={COLORS.muted} />
        <Text style={styles.stateTitle}>Não foi possível carregar os perfis</Text>
        <Text style={styles.stateText}>Confira a conexão com a internet e tente de novo.</Text>
        <Pressable accessibilityRole="button" onPress={() => void recarregar()} style={styles.retry}>
          <Text style={styles.retryText}>Tentar de novo</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Onde você está trabalhando?</Text>
        <Text style={styles.subtitle}>
          Cada perfil tem os próprios alunos, exercícios, treinos e financeiro. Troque de perfil para não misturar os dados.
        </Text>

        <View accessibilityRole="radiogroup">
          {perfis.map((perfil, index) => {
            const ativo = perfil.id === perfilId;
            const alunosTexto = `${perfil.total_alunos} aluno${perfil.total_alunos === 1 ? '' : 's'}`;
            return (
              <StaggerItem key={perfil.id} index={index} style={[styles.card, ativo && styles.cardActive]}>
                <PressableScale
                  accessibilityRole="radio"
                  accessibilityState={{ checked: ativo }}
                  accessibilityLabel={`${perfil.nome}. ${PERFIL_DESCRICAO[perfil.tipo]}. ${alunosTexto}${ativo ? '. Perfil ativo' : ''}`}
                  onPress={() => selecionar(perfil)}
                  pressedScale={0.98}
                  style={styles.cardMain}>
                  <View style={[styles.iconCircle, ativo && styles.iconCircleActive]}>
                    <MaterialIcons name={PERFIL_ICON[perfil.tipo]} size={28} color={ativo ? COLORS.white : COLORS.blue} />
                  </View>
                  <View style={styles.cardCopy}>
                    <Text style={styles.cardName}>{perfil.nome}</Text>
                    <Text style={styles.cardDescription}>{PERFIL_DESCRICAO[perfil.tipo]}</Text>
                    <View style={styles.tags}>
                      <Tag icon="people" label={alunosTexto} tone="neutral" />
                      {ativo && <Tag icon="check-circle-outline" label="Ativo" tone="blue" />}
                    </View>
                  </View>
                </PressableScale>
                <Pressable accessibilityRole="button" accessibilityLabel={`Renomear perfil ${perfil.nome}`} onPress={() => abrirRenomear(perfil)} style={styles.renameButton}>
                  <MaterialIcons name="edit" size={21} color={COLORS.blue} />
                </Pressable>
              </StaggerItem>
            );
          })}
        </View>

        <View style={styles.note}>
          <MaterialIcons name="info-outline" size={20} color={COLORS.blueDark} />
          <Text style={styles.noteText}>O perfil escolhido aparece no topo de todas as abas e continua ativo quando você fecha o app.</Text>
        </View>
      </ScrollView>

      <Modal transparent visible={editando !== null} animationType="slide" onRequestClose={() => setEditando(null)}>
        <KeyboardAvoidingView behavior="padding" style={styles.backdrop}>
          <View style={[styles.sheet, { paddingBottom: 24 + insets.bottom }]}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Renomear perfil</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Fechar sem salvar" onPress={() => setEditando(null)} style={styles.closeButton}>
                <MaterialIcons name="close" size={26} color={COLORS.muted} />
              </Pressable>
            </View>
            <Text style={styles.label}>Nome do perfil</Text>
            <TextInput
              accessibilityLabel="Nome do perfil"
              autoFocus
              value={nome}
              onChangeText={setNome}
              placeholder="Ex.: Studio Geração Energia"
              placeholderTextColor="#9AA4AD"
              style={styles.input}
              maxLength={100}
            />
            <Pressable accessibilityRole="button" disabled={salvando} onPress={() => void salvarNome()} style={styles.save}>
              {salvando ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveText}>Salvar nome</Text>}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(23, 33, 43, 0.4)', flex: 1, justifyContent: 'flex-end' },
  card: { backgroundColor: COLORS.white, borderColor: COLORS.border, borderRadius: RADIUS.md, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  cardActive: { borderColor: COLORS.blue, borderWidth: 2 },
  cardCopy: { flex: 1, paddingRight: 40 },
  cardDescription: { color: COLORS.muted, fontSize: 14, lineHeight: 19, marginTop: 2 },
  cardMain: { alignItems: 'flex-start', flexDirection: 'row', gap: 14, minHeight: 96, padding: 16 },
  cardName: { color: COLORS.text, fontSize: 18, fontWeight: '700' },
  center: { alignItems: 'center', backgroundColor: COLORS.background, flex: 1, justifyContent: 'center', padding: 28 },
  closeButton: { alignItems: 'center', height: TOUCH, justifyContent: 'center', width: TOUCH },
  container: { backgroundColor: COLORS.background, flex: 1 },
  content: { padding: 20, paddingBottom: 32 },
  iconCircle: { alignItems: 'center', backgroundColor: COLORS.blueLight, borderRadius: 26, height: 52, justifyContent: 'center', width: 52 },
  iconCircleActive: { backgroundColor: COLORS.blue },
  input: { borderColor: COLORS.border, borderRadius: RADIUS.sm, borderWidth: 1, color: COLORS.text, fontSize: 16, height: 48, marginBottom: 16, paddingHorizontal: 14 },
  label: { color: COLORS.text, fontSize: 14, fontWeight: '600', marginBottom: 7 },
  note: { alignItems: 'flex-start', backgroundColor: COLORS.blueLight, borderRadius: RADIUS.sm, flexDirection: 'row', gap: 8, marginTop: 8, padding: 12 },
  noteText: { color: COLORS.blueDark, flex: 1, fontSize: 14, lineHeight: 20 },
  renameButton: { alignItems: 'center', height: TOUCH, justifyContent: 'center', position: 'absolute', right: 6, top: 6, width: TOUCH },
  retry: { backgroundColor: COLORS.blue, borderRadius: RADIUS.sm, marginTop: 18, paddingHorizontal: 18, paddingVertical: 12 },
  retryText: { color: COLORS.white, fontWeight: '700' },
  save: { alignItems: 'center', backgroundColor: COLORS.blue, borderRadius: RADIUS.sm, height: 50, justifyContent: 'center' },
  saveText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  sheet: { backgroundColor: COLORS.white, borderTopLeftRadius: RADIUS.lg, borderTopRightRadius: RADIUS.lg, padding: 20 },
  sheetHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  sheetTitle: { color: COLORS.text, fontSize: 22, fontWeight: '700' },
  stateText: { color: COLORS.muted, fontSize: 15, marginTop: 6, textAlign: 'center' },
  stateTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700', marginTop: 12, textAlign: 'center' },
  subtitle: { color: COLORS.muted, fontSize: 15, lineHeight: 21, marginBottom: 18, marginTop: 6 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  title: { color: COLORS.text, fontSize: 22, fontWeight: '700' },
});
