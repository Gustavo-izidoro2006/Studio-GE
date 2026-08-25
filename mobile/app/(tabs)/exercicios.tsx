import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

type Exercicio = { id: number; nome: string; grupo_muscular: string; descricao: string };
type ExercicioForm = { nome: string; grupo_muscular: string; descricao: string };

const API_URL = 'http://192.168.100.52:8000/api/exercicios/';
const COLORS = { blue: '#185FA5', text: '#17212B', muted: '#6B7680', border: '#D9E0E6', background: '#F7F9FB', white: '#FFFFFF', danger: '#B42318' };
const EMPTY_FORM: ExercicioForm = { nome: '', grupo_muscular: '', descricao: '' };

export default function ExerciciosScreen() {
  const [exercicios, setExercicios] = useState<Exercicio[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Exercicio | null>(null);
  const [form, setForm] = useState<ExercicioForm>(EMPTY_FORM);

  useEffect(() => { void loadExercicios(); }, []);

  async function loadExercicios() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Não foi possível carregar os exercícios.');
      const data: Exercicio[] | { results: Exercicio[] } = await response.json();
      setExercicios(Array.isArray(data) ? data : data.results);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Erro ao carregar exercícios.');
    } finally { setLoading(false); }
  }

  function openCreate() { setEditing(null); setForm(EMPTY_FORM); setModalVisible(true); }
  function openEdit(item: Exercicio) {
    setEditing(item);
    setForm({ nome: item.nome, grupo_muscular: item.grupo_muscular ?? '', descricao: item.descricao ?? '' });
    setModalVisible(true);
  }

  async function saveExercicio() {
    const nome = form.nome.trim();
    if (!nome) { Alert.alert('Nome obrigatório', 'Informe o nome do exercício para continuar.'); return; }
    setSaving(true);
    try {
      const response = await fetch(editing ? `${API_URL}${editing.id}/` : API_URL, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, grupo_muscular: form.grupo_muscular.trim(), descricao: form.descricao.trim() }),
      });
      if (!response.ok) throw new Error('Não foi possível salvar o exercício.');
      const saved: Exercicio = await response.json();
      setExercicios((current) => editing ? current.map((item) => item.id === saved.id ? saved : item) : [saved, ...current]);
      setModalVisible(false);
    } catch (requestError) { Alert.alert('Erro', requestError instanceof Error ? requestError.message : 'Erro ao salvar exercício.'); }
    finally { setSaving(false); }
  }

  function deleteExercicio(item: Exercicio) {
    Alert.alert('Excluir exercício', `Deseja excluir ${item.nome}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => void confirmDelete(item) },
    ]);
  }

  async function confirmDelete(item: Exercicio) {
    try {
      const response = await fetch(`${API_URL}${item.id}/`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Não foi possível excluir o exercício.');
      setExercicios((current) => current.filter((exercise) => exercise.id !== item.id));
    } catch (requestError) { Alert.alert('Erro', requestError instanceof Error ? requestError.message : 'Erro ao excluir exercício.'); }
  }

  function renderItem({ item }: { item: Exercicio }) {
    return <View style={styles.row}>
      <Pressable accessibilityLabel={`Editar ${item.nome}`} onPress={() => openEdit(item)} style={styles.info}>
        <View style={styles.icon}><MaterialIcons name="fitness-center" size={23} color={COLORS.blue} /></View>
        <View style={styles.copy}><Text style={styles.name}>{item.nome}</Text><Text style={styles.meta}>{item.grupo_muscular || 'Grupo muscular não informado'}</Text></View>
      </Pressable>
      <Pressable accessibilityLabel={`Excluir ${item.nome}`} onPress={() => deleteExercicio(item)} style={styles.action}><MaterialIcons name="delete-outline" size={22} color={COLORS.danger} /></Pressable>
    </View>;
  }

  return <View style={styles.container}>
    {loading ? <ActivityIndicator color={COLORS.blue} size="large" style={styles.loader} /> : error ? <View style={styles.state}><Text style={styles.stateTitle}>Não foi possível carregar</Text><Text style={styles.message}>{error}</Text><Pressable onPress={() => void loadExercicios()} style={styles.retry}><Text style={styles.retryText}>Tentar novamente</Text></Pressable></View> : <FlatList
      data={exercicios} keyExtractor={(item) => String(item.id)} renderItem={renderItem} refreshing={loading} onRefresh={() => void loadExercicios()}
      contentContainerStyle={exercicios.length ? styles.list : styles.emptyList}
      ListEmptyComponent={<View style={styles.state}><MaterialIcons name="fitness-center" size={46} color={COLORS.blue} /><Text style={styles.stateTitle}>Nenhum exercício cadastrado</Text><Text style={styles.message}>Cadastre o primeiro exercício para começar.</Text></View>}
    />}
    <Pressable accessibilityLabel="Adicionar exercício" onPress={openCreate} style={styles.fab}><MaterialIcons name="add" size={28} color={COLORS.white} /></Pressable>
    <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.backdrop}><View style={styles.modal}>
        <View style={styles.modalHeader}><Text style={styles.modalTitle}>{editing ? 'Editar exercício' : 'Novo exercício'}</Text><Pressable onPress={() => setModalVisible(false)}><MaterialIcons name="close" size={24} color={COLORS.muted} /></Pressable></View>
        <Text style={styles.label}>Nome *</Text><TextInput autoFocus value={form.nome} onChangeText={(nome) => setForm((current) => ({ ...current, nome }))} placeholder="Nome do exercício" placeholderTextColor="#9AA4AD" style={styles.input} />
        <Text style={styles.label}>Grupo muscular</Text><TextInput value={form.grupo_muscular} onChangeText={(grupo_muscular) => setForm((current) => ({ ...current, grupo_muscular }))} placeholder="Ex.: Peito" placeholderTextColor="#9AA4AD" style={styles.input} />
        <Text style={styles.label}>Descrição</Text><TextInput multiline value={form.descricao} onChangeText={(descricao) => setForm((current) => ({ ...current, descricao }))} placeholder="Orientações ou detalhes" placeholderTextColor="#9AA4AD" style={[styles.input, styles.textarea]} />
        <Pressable disabled={saving} onPress={() => void saveExercicio()} style={styles.save}>{saving ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveText}>Salvar exercício</Text>}</Pressable>
      </View></KeyboardAvoidingView>
    </Modal>
  </View>;
}

const styles = StyleSheet.create({
  action: { alignItems: 'center', height: 44, justifyContent: 'center', width: 44 },
  backdrop: { backgroundColor: 'rgba(23, 33, 43, 0.35)', flex: 1, justifyContent: 'flex-end' },
  container: { backgroundColor: '#FFFFFF', flex: 1 },
  copy: { flex: 1, marginLeft: 12 },
  emptyList: { flexGrow: 1, padding: 20 },
  fab: { alignItems: 'center', backgroundColor: '#185FA5', borderRadius: 28, bottom: 22, elevation: 4, height: 56, justifyContent: 'center', position: 'absolute', right: 20, width: 56 },
  icon: { alignItems: 'center', backgroundColor: '#DCEAF7', borderRadius: 24, height: 48, justifyContent: 'center', width: 48 },
  info: { alignItems: 'center', flex: 1, flexDirection: 'row' },
  input: { borderColor: '#D9E0E6', borderRadius: 8, borderWidth: 1, color: '#17212B', fontSize: 16, height: 48, marginBottom: 16, paddingHorizontal: 14 },
  label: { color: '#17212B', fontSize: 14, fontWeight: '600', marginBottom: 7 },
  list: { padding: 16, paddingBottom: 96 },
  loader: { flex: 1 },
  message: { color: '#6B7680', fontSize: 15, marginTop: 8, textAlign: 'center' },
  modal: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 22, paddingBottom: 32 },
  modalHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 22 },
  modalTitle: { color: '#17212B', fontSize: 22, fontWeight: '700' },
  name: { color: '#17212B', fontSize: 17, fontWeight: '700' },
  meta: { color: '#6B7680', fontSize: 14, marginTop: 4 },
  retry: { backgroundColor: '#185FA5', borderRadius: 8, marginTop: 18, paddingHorizontal: 18, paddingVertical: 12 },
  retryText: { color: '#FFFFFF', fontWeight: '700' },
  row: { alignItems: 'center', backgroundColor: '#FFFFFF', borderBottomColor: '#D9E0E6', borderBottomWidth: 1, flexDirection: 'row', minHeight: 76, paddingHorizontal: 4 },
  save: { alignItems: 'center', backgroundColor: '#185FA5', borderRadius: 8, height: 50, justifyContent: 'center' },
  saveText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  state: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 30 },
  stateTitle: { color: '#17212B', fontSize: 19, fontWeight: '700', marginTop: 12, textAlign: 'center' },
  textarea: { height: 88, paddingTop: 12, textAlignVertical: 'top' },
});
