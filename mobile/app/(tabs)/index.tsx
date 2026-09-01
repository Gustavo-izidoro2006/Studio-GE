import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type Turno = 'manha' | 'tarde' | 'noite';
type TurnoFilter = 'todos' | Turno;

type Aluno = { id: number; nome: string; contato: string; data_nascimento: string | null; turno: Turno | null };
type AlunoForm = { nome: string; contato: string; data_nascimento: string; turno: Turno };

const API_URL = 'http://192.168.100.52:8000/api/alunos/';
const COLORS = { blue: '#185FA5', yellow: '#EF9F27', text: '#17212B', muted: '#6B7680', border: '#D9E0E6', background: '#F7F9FB', white: '#FFFFFF', danger: '#B42318' };
const EMPTY_FORM: AlunoForm = { nome: '', contato: '', data_nascimento: '', turno: 'manha' };
const TURNOS_FILTER: Array<{ value: TurnoFilter; label: string }> = [
  { value: 'todos', label: 'Todos' },
  { value: 'manha', label: 'Manhã' },
  { value: 'tarde', label: 'Tarde' },
  { value: 'noite', label: 'Noite' },
];
const TURNOS_FORM: Array<{ value: Turno; label: string }> = [
  { value: 'manha', label: 'Manhã' },
  { value: 'tarde', label: 'Tarde' },
  { value: 'noite', label: 'Noite' },
];

function formatDate(date: string | null) {
  if (!date) return 'Data de nascimento não informada';
  const [year, month, day] = date.split('-');
  return year && month && day ? `${day}/${month}/${year}` : date;
}

function normalizeText(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function getTurnoLabel(turno: Turno | null) {
  switch (turno) {
    case 'manha':
      return 'Manhã';
    case 'tarde':
      return 'Tarde';
    case 'noite':
      return 'Noite';
    default:
      return 'Turno não informado';
  }
}

export default function AlunosScreen() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [turnoFilter, setTurnoFilter] = useState<TurnoFilter>('todos');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAluno, setEditingAluno] = useState<Aluno | null>(null);
  const [form, setForm] = useState<AlunoForm>(EMPTY_FORM);

  useEffect(() => {
    void loadAlunos();
  }, []);

  const filteredAlunos = alunos.filter((aluno) => {
    const matchesSearch = !searchTerm || normalizeText(aluno.nome).includes(normalizeText(searchTerm));
    const matchesTurno = turnoFilter === 'todos' || aluno.turno === turnoFilter;
    return matchesSearch && matchesTurno;
  });

  async function loadAlunos() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Não foi possível carregar os alunos.');
      const data: Aluno[] = await response.json();
      setAlunos(data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Erro ao carregar alunos.');
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingAluno(null);
    setForm(EMPTY_FORM);
    setModalVisible(true);
  }

  function openEditModal(aluno: Aluno) {
    setEditingAluno(aluno);
    setForm({
      nome: aluno.nome,
      contato: aluno.contato ?? '',
      data_nascimento: aluno.data_nascimento ?? '',
      turno: aluno.turno ?? 'manha',
    });
    setModalVisible(true);
  }

  async function saveAluno() {
    const nome = form.nome.trim();
    if (!nome) {
      Alert.alert('Nome obrigatório', 'Informe o nome do aluno para continuar.');
      return;
    }
    if (!form.turno) {
      Alert.alert('Turno obrigatório', 'Selecione o turno do aluno para continuar.');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(editingAluno ? `${API_URL}${editingAluno.id}/` : API_URL, {
        method: editingAluno ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome,
          contato: form.contato.trim(),
          data_nascimento: form.data_nascimento.trim() || null,
          turno: form.turno,
        }),
      });
      if (!response.ok) throw new Error('Não foi possível salvar o aluno.');
      const savedAluno: Aluno = await response.json();
      setAlunos((current) => editingAluno ? current.map((aluno) => aluno.id === savedAluno.id ? savedAluno : aluno) : [savedAluno, ...current]);
      setModalVisible(false);
    } catch (requestError) {
      Alert.alert('Erro', requestError instanceof Error ? requestError.message : 'Erro ao salvar aluno.');
    } finally {
      setSaving(false);
    }
  }

  function deleteAluno(aluno: Aluno) {
    Alert.alert('Excluir aluno', `Deseja excluir ${aluno.nome}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => void confirmDelete(aluno) },
    ]);
  }

  async function confirmDelete(aluno: Aluno) {
    try {
      const response = await fetch(`${API_URL}${aluno.id}/`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Não foi possível excluir o aluno.');
      setAlunos((current) => current.filter((item) => item.id !== aluno.id));
    } catch (requestError) {
      Alert.alert('Erro', requestError instanceof Error ? requestError.message : 'Erro ao excluir aluno.');
    }
  }

  function renderAluno({ item }: { item: Aluno }) {
    const meta = [item.contato || formatDate(item.data_nascimento), getTurnoLabel(item.turno)].filter(Boolean).join(' • ');

    return (
      <View style={styles.studentRow}>
        <Pressable style={styles.studentInfo} onPress={() => router.push(`/aluno/${item.id}`)}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{item.nome.charAt(0).toUpperCase()}</Text></View>
          <View style={styles.studentCopy}>
            <Text style={styles.studentName}>{item.nome}</Text>
            <Text style={styles.studentMeta}>{meta}</Text>
          </View>
        </Pressable>
        <Pressable accessibilityLabel={`Editar ${item.nome}`} onPress={() => openEditModal(item)} style={styles.iconButton}>
          <MaterialIcons name="edit" size={20} color={COLORS.blue} />
        </Pressable>
        <Pressable accessibilityLabel={`Excluir ${item.nome}`} onPress={() => deleteAluno(item)} style={styles.iconButton}>
          <MaterialIcons name="delete-outline" size={22} color={COLORS.danger} />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator color={COLORS.blue} size="large" style={styles.loader} />
      ) : error ? (
        <View style={styles.stateBox}>
          <Text style={styles.stateTitle}>Não foi possível carregar</Text>
          <Text style={styles.stateMessage}>{error}</Text>
          <Pressable onPress={() => void loadAlunos()} style={styles.retryButton}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filteredAlunos}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderAluno}
          contentContainerStyle={filteredAlunos.length ? styles.list : styles.emptyList}
          refreshing={loading}
          onRefresh={() => void loadAlunos()}
          ListHeaderComponent={
            <View style={styles.filterSection}>
              <TextInput
                value={searchTerm}
                onChangeText={setSearchTerm}
                placeholder="Buscar aluno por nome"
                placeholderTextColor="#9AA4AD"
                style={styles.searchInput}
              />
              <View style={styles.turnoFilterRow}>
                {TURNOS_FILTER.map((option) => {
                  const active = turnoFilter === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => setTurnoFilter(option.value)}
                      style={[styles.turnoButton, active && styles.turnoButtonActive]}
                    >
                      <Text style={[styles.turnoButtonText, active && styles.turnoButtonTextActive]}>{option.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.stateBox}>
              <MaterialIcons name="groups" size={46} color={COLORS.blue} />
              <Text style={styles.stateTitle}>Nenhum aluno encontrado</Text>
              <Text style={styles.stateMessage}>Tente outra busca ou ajuste o filtro de turno.</Text>
            </View>
          }
        />
      )}
      <Pressable accessibilityLabel="Adicionar aluno" onPress={openCreateModal} style={styles.fab}>
        <MaterialIcons name="add" size={28} color={COLORS.white} />
      </Pressable>
      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingAluno ? 'Editar aluno' : 'Novo aluno'}</Text>
              <Pressable onPress={() => setModalVisible(false)}><MaterialIcons name="close" size={24} color={COLORS.muted} /></Pressable>
            </View>
            <Text style={styles.label}>Nome *</Text>
            <TextInput autoFocus value={form.nome} onChangeText={(nome) => setForm((current) => ({ ...current, nome }))} placeholder="Nome completo" placeholderTextColor="#9AA4AD" style={styles.input} />
            <Text style={styles.label}>Contato</Text>
            <TextInput value={form.contato} onChangeText={(contato) => setForm((current) => ({ ...current, contato }))} placeholder="Telefone ou e-mail" placeholderTextColor="#9AA4AD" style={styles.input} />
            <Text style={styles.label}>Data de nascimento</Text>
            <TextInput value={form.data_nascimento} onChangeText={(data_nascimento) => setForm((current) => ({ ...current, data_nascimento }))} placeholder="AAAA-MM-DD" placeholderTextColor="#9AA4AD" style={styles.input} />
            <Text style={styles.label}>Turno *</Text>
            <View style={styles.turnoFormRow}>
              {TURNOS_FORM.map((option) => {
                const active = form.turno === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setForm((current) => ({ ...current, turno: option.value }))}
                    style={[styles.turnoFormButton, active && styles.turnoButtonActive]}
                  >
                    <Text style={[styles.turnoButtonText, active && styles.turnoButtonTextActive]}>{option.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable disabled={saving} onPress={() => void saveAluno()} style={styles.saveButton}>
              {saving ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveText}>Salvar aluno</Text>}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', backgroundColor: '#DCEAF7', borderRadius: 24, height: 48, justifyContent: 'center', width: 48 },
  avatarText: { color: COLORS.blue, fontSize: 19, fontWeight: '700' },
  container: { backgroundColor: COLORS.background, flex: 1 },
  emptyList: { flexGrow: 1, padding: 20 },
  fab: { alignItems: 'center', backgroundColor: COLORS.blue, borderRadius: 28, bottom: 22, elevation: 4, height: 56, justifyContent: 'center', position: 'absolute', right: 20, shadowColor: '#000', shadowOffset: { height: 2, width: 0 }, shadowOpacity: 0.2, shadowRadius: 4, width: 56 },
  filterSection: { backgroundColor: COLORS.background, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  iconButton: { alignItems: 'center', height: 44, justifyContent: 'center', width: 44 },
  input: { borderColor: COLORS.border, borderRadius: 8, borderWidth: 1, color: COLORS.text, fontSize: 16, height: 48, marginBottom: 16, paddingHorizontal: 14 },
  label: { color: COLORS.text, fontSize: 14, fontWeight: '600', marginBottom: 7 },
  list: { padding: 16, paddingBottom: 96 },
  loader: { flex: 1 },
  modalBackdrop: { backgroundColor: 'rgba(23, 33, 43, 0.35)', flex: 1, justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.white, borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: 22, paddingBottom: 32 },
  modalHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 22 },
  modalTitle: { color: COLORS.text, fontSize: 22, fontWeight: '700' },
  retryButton: { backgroundColor: COLORS.blue, borderRadius: 8, marginTop: 18, paddingHorizontal: 18, paddingVertical: 12 },
  retryText: { color: COLORS.white, fontWeight: '700' },
  saveButton: { alignItems: 'center', backgroundColor: COLORS.blue, borderRadius: 8, height: 50, justifyContent: 'center', marginTop: 16 },
  saveText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  searchInput: { backgroundColor: COLORS.white, borderColor: COLORS.border, borderRadius: 10, borderWidth: 1, color: COLORS.text, fontSize: 16, height: 46, marginBottom: 12, paddingHorizontal: 14 },
  stateBox: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 30 },
  stateMessage: { color: COLORS.muted, fontSize: 15, marginTop: 8, textAlign: 'center' },
  stateTitle: { color: COLORS.text, fontSize: 19, fontWeight: '700', marginTop: 12, textAlign: 'center' },
  studentCopy: { flex: 1, marginLeft: 12 },
  studentInfo: { alignItems: 'center', flex: 1, flexDirection: 'row' },
  studentMeta: { color: COLORS.muted, fontSize: 14, marginTop: 4 },
  studentName: { color: COLORS.text, fontSize: 17, fontWeight: '700' },
  studentRow: { alignItems: 'center', backgroundColor: COLORS.white, borderBottomColor: COLORS.border, borderBottomWidth: 1, flexDirection: 'row', minHeight: 76, paddingHorizontal: 4 },
  turnoButton: { alignItems: 'center', backgroundColor: COLORS.white, borderColor: COLORS.border, borderRadius: 999, borderWidth: 1, marginRight: 8, paddingHorizontal: 12, paddingVertical: 8 },
  turnoButtonActive: { backgroundColor: COLORS.blue, borderColor: COLORS.blue },
  turnoButtonText: { color: COLORS.text, fontSize: 12, fontWeight: '600' },
  turnoButtonTextActive: { color: COLORS.white },
  turnoFilterRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 },
  turnoFormButton: { alignItems: 'center', backgroundColor: COLORS.white, borderColor: COLORS.border, borderRadius: 8, borderWidth: 1, flex: 1, marginRight: 8, paddingVertical: 10 },
  turnoFormRow: { flexDirection: 'row', marginBottom: 8 },
});
