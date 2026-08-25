import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

type Aluno = { id: number; nome: string };
type Exercicio = { id: number; nome: string; grupo_muscular: string };
type ItemForm = { exercicio: Exercicio; series: string; repeticoes: string; carga: string; adaptacao: string };
type Treino = { id: number; aluno: number; nome: string; observacoes: string };
type ItemTreino = { id: number; treino: number; exercicio: number; series: number | null; repeticoes: number | null; carga: string | number | null; adaptacao: string };

const API_ROOT = 'http://192.168.100.52:8000/api';
const COLORS = { blue: '#185FA5', yellow: '#EF9F27', text: '#17212B', muted: '#6B7680', border: '#D9E0E6', background: '#F7F9FB', white: '#FFFFFF', danger: '#B42318' };

function items<T>(data: T[] | { results: T[] }) { return Array.isArray(data) ? data : data.results; }

export default function TreinosScreen() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [exercicios, setExercicios] = useState<Exercicio[]>([]);
  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [itensSalvos, setItensSalvos] = useState<ItemTreino[]>([]);
  const [alunoId, setAlunoId] = useState<number | null>(null);
  const [treinoNome, setTreinoNome] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [treinoItens, setTreinoItens] = useState<ItemForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [picker, setPicker] = useState<'aluno' | 'exercicio' | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => { void loadOptions(); }, []);

  async function loadOptions() {
    setLoading(true); setError('');
    try {
      const [alunosResponse, exerciciosResponse, treinosResponse, itensResponse] = await Promise.all([
        fetch(`${API_ROOT}/alunos/`), fetch(`${API_ROOT}/exercicios/`), fetch(`${API_ROOT}/treinos/`), fetch(`${API_ROOT}/itens-treino/`),
      ]);
      if (!alunosResponse.ok || !exerciciosResponse.ok || !treinosResponse.ok || !itensResponse.ok) throw new Error('Não foi possível carregar alunos, exercícios e treinos.');
      const alunosData: Aluno[] | { results: Aluno[] } = await alunosResponse.json();
      const exerciciosData: Exercicio[] | { results: Exercicio[] } = await exerciciosResponse.json();
      const treinosData: Treino[] | { results: Treino[] } = await treinosResponse.json();
      const itensData: ItemTreino[] | { results: ItemTreino[] } = await itensResponse.json();
      setAlunos(items(alunosData)); setExercicios(items(exerciciosData)); setTreinos(items(treinosData)); setItensSalvos(items(itensData));
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Erro ao carregar opções.'); }
    finally { setLoading(false); }
  }

  function addExercicio(exercicio: Exercicio) {
    setTreinoItens((current) => current.some((item) => item.exercicio.id === exercicio.id) ? current : [...current, { exercicio, series: '', repeticoes: '', carga: '', adaptacao: '' }]);
    setPicker(null);
  }

  function updateItem(index: number, field: keyof Omit<ItemForm, 'exercicio'>, value: string) {
    setTreinoItens((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));
  }

  async function saveTreino() {
    if (!alunoId) { Alert.alert('Aluno obrigatório', 'Selecione um aluno para criar o treino.'); return; }
    if (!treinoNome.trim()) { Alert.alert('Nome obrigatório', 'Informe o nome do treino para continuar.'); return; }
    setSaving(true);
    try {
      const treinoResponse = await fetch(`${API_ROOT}/treinos/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ aluno: alunoId, nome: treinoNome.trim(), observacoes: observacoes.trim() }) });
      if (!treinoResponse.ok) throw new Error('Não foi possível salvar o treino.');
      const treino: { id: number } = await treinoResponse.json();
      for (const item of treinoItens) {
        const itemResponse = await fetch(`${API_ROOT}/itens-treino/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ treino: treino.id, exercicio: item.exercicio.id, series: item.series ? Number(item.series) : null, repeticoes: item.repeticoes ? Number(item.repeticoes) : null, carga: item.carga || null, adaptacao: item.adaptacao.trim() }) });
        if (!itemResponse.ok) throw new Error('O treino foi criado, mas não foi possível salvar todos os exercícios.');
      }
      Alert.alert('Treino salvo', 'O treino foi criado com sucesso.');
      setTreinoNome(''); setObservacoes(''); setAlunoId(null); setTreinoItens([]); setCreating(false);
    } catch (requestError) { Alert.alert('Erro', requestError instanceof Error ? requestError.message : 'Erro ao salvar treino.'); }
    finally { setSaving(false); }
  }

  const selectedAluno = alunos.find((aluno) => aluno.id === alunoId);
  return <View style={styles.container}>
    {loading ? <ActivityIndicator color={COLORS.blue} size="large" style={styles.loader} /> : error ? <View style={styles.state}><Text style={styles.stateTitle}>Não foi possível carregar</Text><Text style={styles.message}>{error}</Text><Pressable onPress={() => void loadOptions()} style={styles.retry}><Text style={styles.retryText}>Tentar novamente</Text></Pressable></View> : <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.savedHeader}><View><Text style={styles.sectionTitle}>Treinos salvos</Text><Text style={styles.sectionSubtitle}>Organizados por aluno</Text></View><Pressable accessibilityLabel="Atualizar treinos" onPress={() => void loadOptions()}><MaterialIcons name="refresh" size={22} color={COLORS.blue} /></Pressable></View>
      {!treinos.length && <Text style={styles.emptyText}>Nenhum treino salvo ainda.</Text>}
      {treinos.map((treino) => {
        const aluno = alunos.find((item) => item.id === treino.aluno);
        const treinoExercicios = itensSalvos.filter((item) => item.treino === treino.id).map((item) => exercicios.find((exercicio) => exercicio.id === item.exercicio)?.nome).filter(Boolean);
        return <View key={treino.id} style={styles.savedCard}><View style={styles.savedTitleRow}><MaterialIcons name="event-note" size={21} color={COLORS.blue} /><Text style={styles.savedName}>{treino.nome}</Text></View><Text style={styles.savedStudent}>{aluno?.nome ?? `Aluno #${treino.aluno}`}</Text><Text style={styles.savedExercises}>{treinoExercicios.length ? treinoExercicios.join(' · ') : 'Nenhum exercício adicionado'}</Text></View>;
      })}
      {!creating ? <Pressable accessibilityRole="button" onPress={() => setCreating(true)} style={styles.newWorkoutButton}><MaterialIcons name="add" size={20} color={COLORS.white} /><Text style={styles.newWorkoutText}>Novo treino</Text></Pressable> : <>
      <View style={styles.newWorkoutHeader}><Text style={styles.sectionTitle}>Novo treino</Text><Pressable onPress={() => setCreating(false)}><Text style={styles.cancelText}>Cancelar</Text></Pressable></View>
      <Text style={styles.label}>Aluno *</Text>
      <Pressable onPress={() => setPicker('aluno')} style={styles.select}><Text style={selectedAluno ? styles.selectText : styles.placeholder}>{selectedAluno?.nome ?? 'Selecione um aluno'}</Text><MaterialIcons name="expand-more" size={24} color={COLORS.muted} /></Pressable>
      <Text style={styles.label}>Nome do treino *</Text><TextInput value={treinoNome} onChangeText={setTreinoNome} placeholder="Ex.: Treino A" placeholderTextColor="#9AA4AD" style={styles.input} />
      <Text style={styles.label}>Observações</Text><TextInput multiline value={observacoes} onChangeText={setObservacoes} placeholder="Orientações gerais" placeholderTextColor="#9AA4AD" style={[styles.input, styles.textarea]} />
      <View style={styles.exerciseHeading}><Text style={styles.sectionTitle}>Exercícios</Text><Pressable onPress={() => setPicker('exercicio')} style={styles.addExercise}><MaterialIcons name="add" size={18} color={COLORS.blue} /><Text style={styles.addText}>Adicionar</Text></Pressable></View>
      {treinoItens.map((item, index) => <View key={item.exercicio.id} style={styles.itemCard}>
        <View style={styles.itemHeader}><View style={styles.itemTitleWrap}><MaterialIcons name="fitness-center" size={21} color={COLORS.blue} /><Text style={styles.itemTitle}>{item.exercicio.nome}</Text></View><Pressable onPress={() => setTreinoItens((current) => current.filter((_, itemIndex) => itemIndex !== index))}><MaterialIcons name="delete-outline" size={21} color={COLORS.danger} /></Pressable></View>
        <View style={styles.numberFields}><View style={styles.numberField}><Text style={styles.smallLabel}>Séries</Text><TextInput keyboardType="number-pad" value={item.series} onChangeText={(value) => updateItem(index, 'series', value)} style={styles.smallInput} /></View><View style={styles.numberField}><Text style={styles.smallLabel}>Repetições</Text><TextInput keyboardType="number-pad" value={item.repeticoes} onChangeText={(value) => updateItem(index, 'repeticoes', value)} style={styles.smallInput} /></View><View style={styles.numberField}><Text style={styles.smallLabel}>Carga (kg)</Text><TextInput keyboardType="decimal-pad" value={item.carga} onChangeText={(value) => updateItem(index, 'carga', value)} style={styles.smallInput} /></View></View>
        <Text style={styles.smallLabel}>Adaptação</Text><TextInput value={item.adaptacao} onChangeText={(value) => updateItem(index, 'adaptacao', value)} placeholder="Opcional" placeholderTextColor="#9AA4AD" style={styles.input} />
      </View>)}
      {!treinoItens.length && <Text style={styles.emptyText}>Nenhum exercício adicionado. O treino pode ser salvo sem exercícios.</Text>}
      <Pressable disabled={saving} onPress={() => void saveTreino()} style={styles.save}>{saving ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveText}>Salvar treino</Text>}</Pressable>
      </>}
    </ScrollView>}
    <Modal transparent visible={picker !== null} animationType="fade" onRequestClose={() => setPicker(null)}><Pressable style={styles.modalBackdrop} onPress={() => setPicker(null)}><View style={styles.picker}><Text style={styles.pickerTitle}>{picker === 'aluno' ? 'Selecionar aluno' : 'Adicionar exercício'}</Text><FlatList data={picker === 'aluno' ? alunos : exercicios.filter((item) => !treinoItens.some((selected) => selected.exercicio.id === item.id))} keyExtractor={(item) => String(item.id)} renderItem={({ item }) => <Pressable style={styles.option} onPress={() => picker === 'aluno' ? (setAlunoId(item.id), setPicker(null)) : addExercicio(item as Exercicio)}><Text style={styles.optionText}>{item.nome}</Text>{'grupo_muscular' in item && <Text style={styles.optionMeta}>{item.grupo_muscular || 'Grupo muscular não informado'}</Text>}</Pressable>} ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma opção disponível.</Text>} /></View></Pressable></Modal>
  </View>;
}

const styles = StyleSheet.create({
  addExercise: { alignItems: 'center', flexDirection: 'row', gap: 3 }, addText: { color: COLORS.blue, fontWeight: '700' }, cancelText: { color: COLORS.muted, fontSize: 14, fontWeight: '700' }, container: { backgroundColor: COLORS.background, flex: 1 }, content: { padding: 20, paddingBottom: 40 }, emptyList: { paddingVertical: 12 }, emptyText: { color: COLORS.muted, fontSize: 14, lineHeight: 20, paddingVertical: 12 }, exerciseHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, marginTop: 18 }, input: { borderColor: COLORS.border, borderRadius: 8, borderWidth: 1, color: COLORS.text, fontSize: 16, height: 48, marginBottom: 16, paddingHorizontal: 14 }, itemCard: { backgroundColor: COLORS.white, borderRadius: 10, marginBottom: 12, padding: 14 }, itemHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }, itemTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700', marginLeft: 8 }, itemTitleWrap: { alignItems: 'center', flexDirection: 'row' }, label: { color: COLORS.text, fontSize: 14, fontWeight: '600', marginBottom: 7 }, loader: { flex: 1 }, message: { color: COLORS.muted, fontSize: 15, marginTop: 8, textAlign: 'center' }, modalBackdrop: { alignItems: 'center', backgroundColor: 'rgba(23, 33, 43, 0.4)', flex: 1, justifyContent: 'center', padding: 24 }, newWorkoutButton: { alignItems: 'center', backgroundColor: COLORS.blue, borderRadius: 8, flexDirection: 'row', justifyContent: 'center', marginTop: 24, paddingVertical: 13 }, newWorkoutHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 }, numberField: { flex: 1, marginRight: 8 }, numberFields: { flexDirection: 'row', marginBottom: 10 }, option: { borderBottomColor: COLORS.border, borderBottomWidth: 1, paddingVertical: 14 }, optionMeta: { color: COLORS.muted, fontSize: 13, marginTop: 3 }, optionText: { color: COLORS.text, fontSize: 16, fontWeight: '600' }, picker: { backgroundColor: COLORS.white, borderRadius: 12, maxHeight: '75%', padding: 20, width: '100%' }, pickerTitle: { color: COLORS.text, fontSize: 20, fontWeight: '700', marginBottom: 12 }, placeholder: { color: '#9AA4AD', flex: 1, fontSize: 16 }, retry: { backgroundColor: COLORS.blue, borderRadius: 8, marginTop: 18, paddingHorizontal: 18, paddingVertical: 12 }, retryText: { color: COLORS.white, fontWeight: '700' }, save: { alignItems: 'center', backgroundColor: COLORS.blue, borderRadius: 8, height: 50, justifyContent: 'center', marginTop: 12 }, newWorkoutText: { color: COLORS.white, fontSize: 16, fontWeight: '700', marginLeft: 6 }, saveText: { color: COLORS.white, fontSize: 16, fontWeight: '700' }, savedCard: { backgroundColor: COLORS.white, borderRadius: 10, marginBottom: 10, padding: 14 }, savedExercises: { color: COLORS.muted, fontSize: 13, marginTop: 8 }, savedHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }, savedName: { color: COLORS.text, flex: 1, fontSize: 16, fontWeight: '700', marginLeft: 8 }, savedStudent: { color: COLORS.blue, fontSize: 14, fontWeight: '600', marginTop: 8 }, sectionSubtitle: { color: COLORS.muted, fontSize: 13, marginTop: 3 }, state: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 30 }, stateTitle: { color: COLORS.text, fontSize: 19, fontWeight: '700', textAlign: 'center' }, textarea: { height: 82, paddingTop: 12, textAlignVertical: 'top' },
});