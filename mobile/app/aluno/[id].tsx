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
import { LineChart } from 'react-native-gifted-charts';
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

type MedidaForm = Record<'data_avaliacao' | 'peso' | 'altura' | 'braco' | 'abdomen' | 'torax' | 'cintura' | 'quadril' | 'perna' | 'suprailiaca' | 'subescapular' | 'panturrilha' | 'triceps', string>;
type MedidaKey = Exclude<keyof MedidaForm, 'data_avaliacao'>;

type Field = {
  key: MedidaKey;
  label: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
};

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

const measurementKeys: MedidaKey[] = fields.map((field) => field.key);

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

type TabType = 'atual' | 'evolucao';
type MetricKey = 'peso' | 'imc';

const metricOptions: Array<{ key: MetricKey; label: string }> = [
  { key: 'peso', label: 'Peso' },
  { key: 'imc', label: 'IMC' },
];

export default function MedidasAlunoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [medida, setMedida] = useState<Medida | null>(null);
  const [historicoMedidas, setHistoricoMedidas] = useState<Medida[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formVisible, setFormVisible] = useState(false);
  const [form, setForm] = useState<MedidaForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('atual');
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('peso');
  const [selectedHistoryId, setSelectedHistoryId] = useState<number | null>(null);

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
      const medidasOrdenadas = responseItems(medidasData)
        .filter((item) => String((item as Medida & { aluno?: number }).aluno) === String(id))
        .sort((first, second) => second.data_avaliacao.localeCompare(first.data_avaliacao));
      const latest = medidasOrdenadas[0] ?? null;
      setAluno(alunoData);
      setMedida(latest);
      setHistoricoMedidas(medidasOrdenadas);
      setSelectedHistoryId((current) => {
        if (medidasOrdenadas.length === 0) return null;
        if (current && medidasOrdenadas.some((item) => item.id === current)) return current;
        return medidasOrdenadas[0].id;
      });
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

  const atual = historicoMedidas[0] ?? medida;
  const anterior = historicoMedidas[1] ?? null;
  const selectedHistoryMeasure = historicoMedidas.find((item) => item.id === selectedHistoryId) ?? historicoMedidas[0] ?? null;

  const metricSeries = historicoMedidas
    .slice()
    .reverse()
    .map((item) => {
      const value = selectedMetric === 'peso' ? Number(item.peso) : Number(item.imc);
      if (Number.isNaN(value)) {
        return null;
      }

      return {
        value,
        label: new Date(item.data_avaliacao).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        dataPointText: value.toFixed(selectedMetric === 'peso' ? 1 : 2),
      };
    })
    .filter((item): item is { value: number; label: string; dataPointText: string } => item !== null);

  const renderDiferenca = (field: Field) => {
    const atualValue = atual?.[field.key];
    const anteriorValue = anterior?.[field.key];
    if (atualValue === null || atualValue === undefined || atualValue === '' || anteriorValue === null || anteriorValue === undefined || anteriorValue === '') {
      return null;
    }

    const atualNumero = Number(atualValue);
    const anteriorNumero = Number(anteriorValue);
    if (Number.isNaN(atualNumero) || Number.isNaN(anteriorNumero)) {
      return null;
    }

    const diferenca = atualNumero - anteriorNumero;
    const sinal = diferenca > 0 ? '+' : '';
    return (
      <View key={field.key} style={styles.evolutionMetric}>
        <Text style={styles.evolutionMetricLabel}>{field.label}</Text>
        <Text style={styles.evolutionMetricValue}>{`${sinal}${diferenca.toFixed(2)}`}</Text>
      </View>
    );
  };

  const renderMeasureDetails = (measure: Medida | null, showBirthDate = true) => (
    <>
      <Text style={styles.studentName}>{aluno?.nome ?? 'Aluno'}</Text>
      <Text style={styles.lastEvaluation}>
        {measure ? formatDate(measure.data_avaliacao) : 'Vazio'}
      </Text>
      <View style={styles.imcCard}>
        <View>
          <Text style={styles.imcLabel}>IMC</Text>
          <Text style={styles.imcCaption}>Índice de massa corporal</Text>
        </View>
        <Text style={styles.imcValue}>{displayValue(measure?.imc ?? null)}</Text>
      </View>
      <View style={styles.fieldsCard}>
        {showBirthDate && (
          <View style={styles.fieldRow}>
            <MaterialIcons name="cake" size={22} color={COLORS.blue} />
            <Text style={styles.fieldLabel}>Nascimento</Text>
            <Text style={styles.fieldValue}>{formatDate(aluno?.data_nascimento ?? null)}</Text>
          </View>
        )}
        {fields.map((field) => (
          <View key={field.key} style={styles.fieldRow}>
            <MaterialIcons name={field.icon} size={22} color={COLORS.blue} />
            <Text style={styles.fieldLabel}>{field.label}</Text>
            <Text style={[styles.fieldValue, (measure?.[field.key] === null || measure?.[field.key] === undefined || measure?.[field.key] === '') && styles.emptyValue]}>{displayValue(measure?.[field.key] ?? null)}</Text>
          </View>
        ))}
      </View>
    </>
  );

  const renderAtualTab = () => (
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
  );

  const renderEvolucaoTab = () => {
    if (historicoMedidas.length < 2) {
      return (
        <View style={styles.emptyEvolutionBox}>
          <Text style={styles.emptyEvolutionTitle}>Ainda não há dados suficientes para comparação</Text>
          <Text style={styles.emptyEvolutionText}>Cadastre pelo menos duas avaliações para acompanhar a evolução do aluno.</Text>
        </View>
      );
    }

    if (!atual || !anterior) {
      return (
        <View style={styles.emptyEvolutionBox}>
          <Text style={styles.emptyEvolutionTitle}>Ainda não há dados suficientes para comparação</Text>
          <Text style={styles.emptyEvolutionText}>Cadastre pelo menos duas avaliações para acompanhar a evolução do aluno.</Text>
        </View>
      );
    }

    const atualValue = selectedMetric === 'peso' ? Number(atual.peso) : Number(atual.imc);
    const anteriorValue = selectedMetric === 'peso' ? Number(anterior.peso) : Number(anterior.imc);
    const diferencaSelecionada = Number.isNaN(atualValue) || Number.isNaN(anteriorValue) ? null : atualValue - anteriorValue;
    const chartWidth = Math.max(320, metricSeries.length * 72);

    return (
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.studentName}>{aluno?.nome ?? 'Aluno'}</Text>

        <View style={styles.metricSelectorContainer}>
          {metricOptions.map((option) => {
            const isActive = selectedMetric === option.key;
            return (
              <Pressable
                key={option.key}
                style={[styles.metricSelectorButton, isActive && styles.metricSelectorButtonActive]}
                onPress={() => setSelectedMetric(option.key)}
              >
                <Text style={[styles.metricSelectorText, isActive && styles.metricSelectorTextActive]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.comparisonCard}>
          <Text style={styles.comparisonValue}>
            {diferencaSelecionada === null ? '—' : `${diferencaSelecionada > 0 ? '+' : ''}${diferencaSelecionada.toFixed(selectedMetric === 'peso' ? 1 : 2)} ${selectedMetric === 'peso' ? 'kg' : ''}`}
          </Text>
          <Text style={styles.comparisonLabel}>desde a última avaliação</Text>
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>{selectedMetric === 'peso' ? 'Peso ao longo do tempo' : 'IMC ao longo do tempo'}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.chartScrollContent, { width: chartWidth }]}>
            <LineChart
              data={metricSeries}
              width={chartWidth}
              height={220}
              color={COLORS.blue}
              thickness={3}
              spacing={Math.max(36, chartWidth / Math.max(metricSeries.length, 1) - 12)}
              initialSpacing={20}
              endSpacing={20}
              maxValue={Math.max(...metricSeries.map((point) => point.value), 0) * 1.1 || 1}
              noOfSections={4}
              rulesType="solid"
              rulesColor={COLORS.border}
              xAxisColor={COLORS.border}
              yAxisColor={COLORS.border}
              xAxisLabelTextStyle={styles.chartAxisText}
              yAxisTextStyle={styles.chartAxisText}
              dataPointsColor={COLORS.blue}
              dataPointsRadius={4}
              areaChart
              startFillColor={COLORS.blue}
              endFillColor={COLORS.white}
              startOpacity={0.2}
              endOpacity={0.02}
              curved={false}
            />
          </ScrollView>
        </View>

        <View style={styles.evolutionSummaryCard}>
          <Text style={styles.evolutionSummaryTitle}>Comparação atual x anterior</Text>
          <Text style={styles.evolutionSummaryDate}>{formatDate(atual.data_avaliacao)} vs {formatDate(anterior.data_avaliacao)}</Text>
          <View style={styles.evolutionMetricsGrid}>{fields.map(renderDiferenca).filter(Boolean)}</View>
        </View>

        <View style={styles.historyCard}>
          <Text style={styles.historyTitle}>Histórico de avaliações</Text>
          {historicoMedidas.map((item) => {
            const isSelected = selectedHistoryMeasure?.id === item.id;
            return (
              <Pressable
                key={item.id}
                style={[styles.historyItem, isSelected && styles.historyItemSelected]}
                onPress={() => setSelectedHistoryId(item.id)}
              >
                <Text style={styles.historyDate}>{formatDate(item.data_avaliacao)}</Text>
                <Text style={styles.historyMeta}>{isSelected ? 'Avaliação selecionada' : 'Ver detalhes da avaliação'}</Text>
              </Pressable>
            );
          })}
        </View>

        {selectedHistoryMeasure && (
          <View style={styles.selectedMeasureCard}>
            {renderMeasureDetails(selectedHistoryMeasure, false)}
          </View>
        )}
      </ScrollView>
    );
  };

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
          <>
            <View style={styles.tabBar}>
              {(['atual', 'evolucao'] as TabType[]).map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <Pressable
                    key={tab}
                    onPress={() => setActiveTab(tab)}
                    style={[styles.tabButton, isActive && styles.tabButtonActive]}
                  >
                    <Text style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}>
                      {tab === 'atual' ? 'Atual' : 'Evolução'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {activeTab === 'atual' ? renderAtualTab() : renderEvolucaoTab()}
          </>
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
  chartAxisText: { color: COLORS.muted, fontSize: 10 },
  chartCard: { backgroundColor: COLORS.white, borderRadius: 12, marginBottom: 18, padding: 18 },
  chartScrollContent: { paddingRight: 8 },
  chartTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700', marginBottom: 12 },
  comparisonCard: { backgroundColor: COLORS.paleYellow, borderRadius: 12, marginBottom: 18, padding: 18 },
  comparisonLabel: { color: COLORS.muted, fontSize: 12, marginTop: 6 },
  comparisonValue: { color: COLORS.text, fontSize: 24, fontWeight: '800' },
  content: { padding: 20, paddingBottom: 32 },
  emptyEvolutionBox: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 28 },
  emptyEvolutionText: { color: COLORS.muted, fontSize: 15, marginTop: 8, textAlign: 'center' },
  emptyEvolutionTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  emptyValue: { color: COLORS.muted },
  evolutionMetric: { backgroundColor: COLORS.white, borderColor: COLORS.border, borderRadius: 10, borderWidth: 1, flexBasis: '48%', marginBottom: 12, padding: 12 },
  evolutionMetricLabel: { color: COLORS.muted, fontSize: 12 },
  evolutionMetricValue: { color: COLORS.blue, fontSize: 18, fontWeight: '700', marginTop: 6 },
  evolutionMetricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 16 },
  evolutionSummaryCard: { backgroundColor: COLORS.white, borderRadius: 12, marginBottom: 18, padding: 18 },
  evolutionSummaryDate: { color: COLORS.muted, fontSize: 13, marginTop: 6 },
  evolutionSummaryTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700' },
  fieldLabel: { color: COLORS.text, flex: 1, fontSize: 15, marginLeft: 12 },
  fieldRow: { alignItems: 'center', borderBottomColor: COLORS.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', minHeight: 54 },
  fieldValue: { color: COLORS.text, fontSize: 15, fontWeight: '600' },
  fieldsCard: { backgroundColor: COLORS.white, borderRadius: 10, paddingHorizontal: 16 },
  formHint: { color: COLORS.muted, fontSize: 14, marginBottom: 16 },
  formInput: { borderColor: COLORS.border, borderRadius: 8, borderWidth: 1, color: COLORS.text, fontSize: 16, height: 46, marginBottom: 14, paddingHorizontal: 14 },
  formLabel: { color: COLORS.text, fontSize: 14, fontWeight: '600', marginBottom: 7 },
  header: { alignItems: 'center', backgroundColor: COLORS.white, borderBottomColor: COLORS.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', height: 56, justifyContent: 'space-between' },
  headerButton: { alignItems: 'center', height: 48, justifyContent: 'center', width: 56 },
  headerTitle: { color: COLORS.blue, fontSize: 18, fontWeight: '700' },
  historyCard: { backgroundColor: COLORS.white, borderRadius: 12, padding: 16 },
  historyDate: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  historyItem: { borderBottomColor: COLORS.border, borderBottomWidth: StyleSheet.hairlineWidth, paddingBottom: 12, paddingTop: 12 },
  historyItemSelected: { backgroundColor: '#EEF5FF', borderRadius: 10, paddingHorizontal: 10 },
  historyMeta: { color: COLORS.muted, fontSize: 12, marginTop: 4 },
  historyTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700', marginBottom: 8 },
  imcCaption: { color: '#765D2C', fontSize: 13, marginTop: 4 },
  imcCard: { alignItems: 'center', backgroundColor: COLORS.paleYellow, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, marginTop: 20, padding: 20 },
  imcLabel: { color: COLORS.text, fontSize: 24, fontWeight: '800' },
  imcValue: { color: COLORS.blue, fontSize: 30, fontWeight: '800' },
  lastEvaluation: { color: COLORS.muted, fontSize: 14, marginTop: 6 },
  loader: { flex: 1 },
  metricSelectorButton: { backgroundColor: COLORS.white, borderColor: COLORS.border, borderRadius: 999, borderWidth: 1, flex: 1, marginRight: 8, paddingVertical: 10 },
  metricSelectorButtonActive: { backgroundColor: COLORS.blue, borderColor: COLORS.blue },
  metricSelectorContainer: { flexDirection: 'row', marginBottom: 18 },
  metricSelectorText: { color: COLORS.text, fontSize: 14, fontWeight: '700', textAlign: 'center' },
  metricSelectorTextActive: { color: COLORS.white },
  modalBackdrop: { backgroundColor: 'rgba(23, 33, 43, 0.4)', flex: 1, justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.white, borderTopLeftRadius: 18, borderTopRightRadius: 18, maxHeight: '92%', padding: 22, paddingBottom: 30 },
  modalHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  modalTitle: { color: COLORS.text, fontSize: 22, fontWeight: '700' },
  pointerLabel: { backgroundColor: 'rgba(23, 33, 43, 0.85)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6 },
  pointerLabelText: { color: COLORS.white, fontSize: 11 },
  safeArea: { backgroundColor: COLORS.background, flex: 1 },
  saveButton: { alignItems: 'center', backgroundColor: COLORS.blue, borderRadius: 8, height: 50, justifyContent: 'center', marginTop: 8 },
  saveText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  selectedMeasureCard: { backgroundColor: COLORS.white, borderRadius: 12, marginTop: 18, padding: 18 },
  stateBox: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 24 },
  stateTitle: { color: COLORS.text, fontSize: 17, textAlign: 'center' },
  studentName: { color: COLORS.text, fontSize: 30, fontWeight: '800' },
  tabBar: { backgroundColor: COLORS.white, borderBottomColor: COLORS.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12 },
  tabButton: { alignItems: 'center', backgroundColor: '#EEF3F8', borderRadius: 999, flex: 1, marginRight: 8, paddingVertical: 10 },
  tabButtonActive: { backgroundColor: COLORS.blue },
  tabButtonText: { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  tabButtonTextActive: { color: COLORS.white },
});
