import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Aluno = {
  nome: string;
  data_nascimento: string | null;
};

type Medida = {
  id: number;
  data_avaliacao: string;
  peso: number | string | null;
  altura: number | string | null;
  braco: number | string | null;
  abdomen: number | string | null;
  torax: number | string | null;
  cintura: number | string | null;
  quadril: number | string | null;
  perna: number | string | null;
  suprailiaca: number | string | null;
  subescapular: number | string | null;
  panturrilha: number | string | null;
  triceps: number | string | null;
  imc: number | string | null;
};

type Field = {
  key: keyof Medida;
  label: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
};

type MedidaForm = Record<'data_avaliacao' | 'peso' | 'altura' | 'braco' | 'abdomen' | 'torax' | 'cintura' | 'quadril' | 'perna' | 'suprailiaca' | 'subescapular' | 'panturrilha' | 'triceps', string>;

const API_ROOT = 'http://192.168.100.52:8000/api';
const COLORS = {
  blue: '#185FA5',
  yellow: '#EF9F27',
  paleYellow: '#FFF3D9',
  text: '#17212B',
  muted: '#6B7680',
  border: '#D9E0E6',
  background: '#F7F9FB',
  white: '#FFFFFF',
};

const fields: Field[] = [
  { key: 'peso', label: 'Peso', icon: 'monitor-weight' },
  { key: 'altura', label: 'Altura', icon: 'height' },
  { key: 'braco', label: 'Braço', icon: 'accessibility' },
  { key: 'abdomen', label: 'Abdômen', icon: 'accessibility' },
  { key: 'torax', label: 'Tórax', icon: 'accessibility' },
  { key: 'cintura', label: 'Cintura', icon: 'accessibility' },
  { key: 'quadril', label: 'Quadril', icon: 'accessibility' },
  { key: 'perna', label: 'Perna', icon: 'directions-run' },
  { key: 'suprailiaca', label: 'Suprailíaca', icon: 'accessibility' },
  { key: 'subescapular', label: 'Subescapular', icon: 'accessibility' },
  { key: 'panturrilha', label: 'Panturrilha', icon: 'accessibility' },
  { key: 'triceps', label: 'Tríceps', icon: 'accessibility' },
];

const measurementKeys = fields.map((field) => field.key).filter((key) => key !== 'imc') as (keyof Omit<MedidaForm, 'data_avaliacao'>)[];

const emptyForm: MedidaForm = {
  data_avaliacao: new Date().toISOString().slice(0, 10),
  peso: '', altura: '', braco: '', abdomen: '', torax: '', cintura: '', quadril: '', perna: '', suprailiaca: '', subescapular: '', panturrilha: '', triceps: '',
};

function formatDate(date: string | null) {
  if (!date) return 'Vazio';
  const [year, month, day] = date.split('-');
  return year && month && day ? `${day}/${month}/${year}` : date;
}

function displayValue(value: number | string | null) {
  return value === null || value === undefined || value === '' ? 'Vazio' : String(value);
}

function responseItems<T>(data: T[] | { results: T[] }): T[] {
  return Array.isArray(data) ? data : data.results;
}

export default function MedidasAlunoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [medida, setMedida] = useState<Medida | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formVisible, setFormVisible] = useState(false);
  const [form, setForm] = useState<MedidaForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const loadDetails = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [alunoResponse, medidasResponse] = await Promise.all([
        fetch(`${API_ROOT}/alunos/${id}/`),
        fetch(`${API_ROOT}/medidas/`),
      ]);
      if (!alunoResponse.ok || !medidasResponse.ok) throw new Error('Não foi possível carregar as medidas.');
      const alunoData: Aluno = await alunoResponse.json();
      const medidasData: Medida[] | { results: Medida[] } = await medidasResponse.json();
      const latest = responseItems(medidasData)
        .filter((item) => String((item as Medida & { aluno?: number }).aluno) === String(id))
        .sort((first, second) => second.data_avaliacao.localeCompare(first.data_avaliacao))[0] ?? null;
      setAluno(alunoData);
      setMedida(latest);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Erro ao carregar medidas.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadDetails();
  }, [loadDetails]);

  function openMeasureForm() {
    setForm({ ...emptyForm });
    setFormVisible(true);
  }

  async function saveMeasure() {
    if (!form.data_avaliacao.trim()) {
      Alert.alert('Data obrigatória', 'Informe a data da avaliação.');
      return;
    }

    setSaving(true);
    const payload: Record<string, string | number | null> = {
      aluno: Number(id),
      data_avaliacao: form.data_avaliacao.trim(),
    };
    measurementKeys.forEach((key) => {
      const value = form[key];
      payload[key] = value.trim() ? Number(value.replace(',', '.')) : null;
    });

    try {
      const response = await fetch(`${API_ROOT}/medidas/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Não foi possível salvar a avaliação.');
      setFormVisible(false);
      await loadDetails();
    } catch (requestError) {
      Alert.alert('Erro', requestError instanceof Error ? requestError.message : 'Erro ao salvar avaliação.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Voltar" onPress={() => router.back()} style={styles.headerButton}>
            <MaterialIcons name="arrow-back" size={24} color={COLORS.blue} />
          </Pressable>
          <Text style={styles.headerTitle}>Medidas</Text>
          <Pressable accessibilityLabel="Adicionar avaliação" onPress={openMeasureForm} style={styles.headerButton}>
            <MaterialIcons name="add" size={26} color={COLORS.blue} />
          </Pressable>
        </View>
        {loading ? <ActivityIndicator color={COLORS.blue} size="large" style={styles.loader} /> : error ? (
          <View style={styles.stateBox}><Text style={styles.stateTitle}>{error}</Text></View>
        ) : (
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.studentName}>{aluno?.nome ?? 'Aluno'}</Text>
            <Text style={styles.lastEvaluation}>
              Última avaliação: {medida ? formatDate(medida.data_avaliacao) : 'Vazio'}
            </Text>
            <View style={styles.imcCard}>
              <View>
                <Text style={styles.imcLabel}>IMC</Text>
                <Text style={styles.imcCaption}>Índice de massa corporal</Text>
              </View>
              <Text style={styles.imcValue}>{displayValue(medida?.imc ?? null)}</Text>
            </View>
            <View style={styles.fieldsCard}>
              <View style={styles.fieldRow}>
                <MaterialIcons name="cake" size={22} color={COLORS.blue} />
                <Text style={styles.fieldLabel}>Nascimento</Text>
                <Text style={styles.fieldValue}>{formatDate(aluno?.data_nascimento ?? null)}</Text>
              </View>
              {fields.map((field) => (
                <View key={field.key} style={styles.fieldRow}>
                  <MaterialIcons name={field.icon} size={22} color={COLORS.blue} />
                  <Text style={styles.fieldLabel}>{field.label}</Text>
                  <Text style={[styles.fieldValue, (medida?.[field.key] === null || medida?.[field.key] === undefined || medida?.[field.key] === '') && styles.emptyValue]}>{displayValue(medida?.[field.key] ?? null)}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
      <Modal animationType="slide" transparent visible={formVisible} onRequestClose={() => setFormVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nova avaliação</Text>
              <Pressable accessibilityLabel="Fechar formulário" onPress={() => setFormVisible(false)}>
                <MaterialIcons name="close" size={24} color={COLORS.muted} />
              </Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.formHint}>Preencha apenas os campos disponíveis.</Text>
              <Text style={styles.formLabel}>Data da avaliação *</Text>
              <TextInput value={form.data_avaliacao} onChangeText={(value) => setForm((current) => ({ ...current, data_avaliacao: value }))} placeholder="AAAA-MM-DD" placeholderTextColor="#9AA4AD" style={styles.formInput} />
              {fields.map((field) => (
                <View key={field.key}>
                  <Text style={styles.formLabel}>{field.label}</Text>
                  <TextInput keyboardType="decimal-pad" value={form[field.key]} onChangeText={(value) => setForm((current) => ({ ...current, [field.key]: value }))} placeholder="Opcional" placeholderTextColor="#9AA4AD" style={styles.formInput} />
                </View>
              ))}
              <Pressable disabled={saving} onPress={() => void saveMeasure()} style={styles.saveButton}>
                {saving ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveText}>Salvar avaliação</Text>}
              </Pressable>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 32 },
  emptyValue: { color: COLORS.muted },
  fieldLabel: { color: COLORS.text, flex: 1, fontSize: 15, marginLeft: 12 },
  fieldRow: { alignItems: 'center', borderBottomColor: COLORS.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', minHeight: 54 },
  fieldValue: { color: COLORS.text, fontSize: 15, fontWeight: '600' },
  fieldsCard: { backgroundColor: COLORS.white, borderRadius: 10, paddingHorizontal: 16 },
  header: { alignItems: 'center', backgroundColor: COLORS.white, borderBottomColor: COLORS.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', height: 56, justifyContent: 'space-between' },
  headerButton: { alignItems: 'center', height: 48, justifyContent: 'center', width: 56 },
  headerTitle: { color: COLORS.blue, fontSize: 18, fontWeight: '700' },
  imcCaption: { color: '#765D2C', fontSize: 13, marginTop: 4 },
  imcCard: { alignItems: 'center', backgroundColor: COLORS.paleYellow, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, marginTop: 20, padding: 20 },
  imcLabel: { color: COLORS.text, fontSize: 24, fontWeight: '800' },
  imcValue: { color: COLORS.blue, fontSize: 30, fontWeight: '800' },
  lastEvaluation: { color: COLORS.muted, fontSize: 14, marginTop: 6 },
  loader: { flex: 1 },
  modalBackdrop: { backgroundColor: 'rgba(23, 33, 43, 0.4)', flex: 1, justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.white, borderTopLeftRadius: 18, borderTopRightRadius: 18, maxHeight: '92%', padding: 22, paddingBottom: 30 },
  modalHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  modalTitle: { color: COLORS.text, fontSize: 22, fontWeight: '700' },
  formHint: { color: COLORS.muted, fontSize: 14, marginBottom: 16 },
  formLabel: { color: COLORS.text, fontSize: 14, fontWeight: '600', marginBottom: 7 },
  formInput: { borderColor: COLORS.border, borderRadius: 8, borderWidth: 1, color: COLORS.text, fontSize: 16, height: 46, marginBottom: 14, paddingHorizontal: 14 },
  saveButton: { alignItems: 'center', backgroundColor: COLORS.blue, borderRadius: 8, height: 50, justifyContent: 'center', marginTop: 8 },
  saveText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  safeArea: { backgroundColor: COLORS.background, flex: 1 },
  stateBox: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 24 },
  stateTitle: { color: COLORS.text, fontSize: 17, textAlign: 'center' },
  studentName: { color: COLORS.text, fontSize: 30, fontWeight: '800' },
});
