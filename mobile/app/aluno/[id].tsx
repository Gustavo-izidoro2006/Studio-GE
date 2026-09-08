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
  { key: 'braco', label: 'Braço', icon: 'fitness-center' },
  { key: 'abdomen', label: 'Abdômen', icon: 'straighten' },
  { key: 'torax', label: 'Tórax', icon: 'unfold-more' },
  { key: 'cintura', label: 'Cintura', icon: 'compare-arrows' },
  { key: 'quadril', label: 'Quadril', icon: 'accessibility-new' },
  { key: 'perna', label: 'Perna', icon: 'directions-run' },
  { key: 'suprailiaca', label: 'Suprailíaca', icon: 'layers' },
  { key: 'subescapular', label: 'Subescapular', icon: 'texture' },
  { key: 'panturrilha', label: 'Panturrilha', icon: 'directions-walk' },
  { key: 'triceps', label: 'Tríceps', icon: 'sports-handball' },
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

type TabType = 'atual' | 'evolucao' | 'historico';
type MetricKey = MedidaKey;

const metricCategories: { title: string; options: { key: MetricKey; label: string }[] }[] = [
  {
    title: 'Composição corporal',
    options: [
      { key: 'peso', label: 'Peso' },
      { key: 'altura', label: 'Altura' },
    ],
  },
  {
    title: 'Circunferências',
    options: [
      { key: 'braco', label: 'Braço' },
      { key: 'abdomen', label: 'Abdômen' },
      { key: 'torax', label: 'Tórax' },
      { key: 'cintura', label: 'Cintura' },
      { key: 'quadril', label: 'Quadril' },
      { key: 'perna', label: 'Perna' },
      { key: 'panturrilha', label: 'Panturrilha' },
    ],
  },
  {
    title: 'Dobras cutâneas',
    options: [
      { key: 'suprailiaca', label: 'Suprailíaca' },
      { key: 'subescapular', label: 'Subescapular' },
      { key: 'triceps', label: 'Tríceps' },
    ],
  },
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
  const [metricSelectorVisible, setMetricSelectorVisible] = useState(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState<number | null>(null);
  const [selectedHistoryIds, setSelectedHistoryIds] = useState<number[]>([]);
  const [comparisonMetricSelectorVisible, setComparisonMetricSelectorVisible] = useState(false);
  const [selectedComparisonMetrics, setSelectedComparisonMetrics] = useState<MetricKey[]>([]);

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
      setSelectedHistoryIds((current) => current.filter((selectedId) => medidasOrdenadas.some((item) => item.id === selectedId)));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Erro ao carregar medidas.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  function toggleHistorySelection(measureId: number) {
    setSelectedHistoryIds((current) => current.includes(measureId) ? current.filter((selectedId) => selectedId !== measureId) : [...current, measureId]);
  }

  function toggleComparisonMetric(metricKey: MetricKey) {
    setSelectedComparisonMetrics((current) => current.includes(metricKey) ? current.filter((selectedKey) => selectedKey !== metricKey) : [...current, metricKey]);
  }

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
  const selectedMetricLabel = metricCategories.flatMap((category) => category.options).find((option) => option.key === selectedMetric)?.label ?? 'Peso';
  const comparisonMetricKeys = selectedComparisonMetrics.length === 0 ? measurementKeys : selectedComparisonMetrics;
  const comparisonMeasures = historicoMedidas
    .filter((item) => selectedHistoryIds.includes(item.id))
    .sort((first, second) => first.data_avaliacao.localeCompare(second.data_avaliacao));

  const metricSeries = historicoMedidas
    .slice()
    .sort((first, second) => first.data_avaliacao.localeCompare(second.data_avaliacao))
    .map((item) => {
      const value = Number(item[selectedMetric]);
      if (Number.isNaN(value)) {
        return null;
      }

      return {
        value,
        label: new Date(item.data_avaliacao).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        dataPointText: value.toFixed(selectedMetric === 'peso' || selectedMetric === 'altura' ? 1 : 2),
      };
    })
    .filter((item): item is { value: number; label: string; dataPointText: string } => item !== null);

  const renderComparisonTable = () => {
    const comparisonFields = fields.filter((field) => comparisonMetricKeys.includes(field.key));
    if (comparisonMeasures.length < 2) {
      return (
        <View style={styles.comparisonEmptyCard}>
          <Text style={styles.comparisonEmptyTitle}>{comparisonMeasures.length === 0 ? 'Selecione avaliações no Histórico' : 'Selecione mais uma avaliação'}</Text>
          <Text style={styles.comparisonEmptyText}>{comparisonMeasures.length === 0 ? 'Marque duas ou mais avaliações para ver a comparação.' : 'Marque mais uma avaliação para ver a comparação.'}</Text>
          <Pressable style={styles.compareButton} onPress={() => setActiveTab('historico')}>
            <MaterialIcons name="check-box" size={20} color={COLORS.white} />
            <Text style={styles.compareButtonText}>Escolher avaliações</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.comparisonTableCard}>
        <Text style={styles.comparisonTableTitle}>Comparação de avaliações</Text>
        <Text style={styles.comparisonTableSubtitle}>{`${comparisonMeasures.length} avaliações selecionadas`}</Text>
        <View style={styles.comparisonTableFrame}>
          <View style={styles.comparisonMetricColumn}>
            <View style={[styles.comparisonHeaderCell, styles.comparisonMetricHeaderCell]}>
              <Text style={styles.comparisonHeaderText}>Métrica</Text>
            </View>
            {comparisonFields.map((field) => (
              <View key={field.key} style={styles.comparisonMetricCell}>
                <Text numberOfLines={2} style={styles.comparisonMetricText}>{field.label}</Text>
              </View>
            ))}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.comparisonHorizontalContent}>
            <View style={{ width: comparisonMeasures.length * 104 }}>
              <View style={styles.comparisonTableRow}>
                {comparisonMeasures.map((measure) => (
                  <View key={measure.id} style={styles.comparisonHeaderCell}>
                    <Text style={styles.comparisonHeaderText}>{formatDate(measure.data_avaliacao)}</Text>
                  </View>
                ))}
              </View>
              {comparisonFields.map((field) => (
                <View key={field.key} style={styles.comparisonTableRow}>
                  {comparisonMeasures.map((measure) => (
                    <View key={`${field.key}-${measure.id}`} style={styles.comparisonValueCell}>
                      <Text style={styles.comparisonValueText}>{displayValue(measure[field.key])}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
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

    const atualValue = Number(atual[selectedMetric]);
    const anteriorValue = Number(anterior[selectedMetric]);
    const diferencaSelecionada = Number.isNaN(atualValue) || Number.isNaN(anteriorValue) ? null : atualValue - anteriorValue;
    const chartWidth = Math.max(320, metricSeries.length * 72);

    return (
      <>
        <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.studentName}>{aluno?.nome ?? 'Aluno'}</Text>

        <Pressable style={styles.compareButton} onPress={() => setActiveTab('historico')}>
          <MaterialIcons name="compare-arrows" size={20} color={COLORS.white} />
          <Text style={styles.compareButtonText}>Comparar avaliações</Text>
        </Pressable>

        <Pressable style={styles.metricDropdown} onPress={() => setMetricSelectorVisible(true)}>
          <View>
            <Text style={styles.metricDropdownLabel}>Métrica exibida</Text>
            <Text style={styles.metricDropdownValue}>{selectedMetricLabel}</Text>
          </View>
          <MaterialIcons name="keyboard-arrow-down" size={26} color={COLORS.blue} />
        </Pressable>

        <View style={styles.comparisonCard}>
          <Text style={styles.comparisonValue}>
            {diferencaSelecionada === null ? '—' : `${diferencaSelecionada > 0 ? '+' : ''}${diferencaSelecionada.toFixed(selectedMetric === 'peso' || selectedMetric === 'altura' ? 1 : 2)} ${selectedMetric === 'peso' ? 'kg' : ''}`}
          </Text>
          <Text style={styles.comparisonLabel}>desde a última avaliação</Text>
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>{`${selectedMetricLabel} ao longo do tempo`}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.chartScrollContent, { width: chartWidth }]}>
            <LineChart
              data={metricSeries}
              width={chartWidth}
              height={220}
              color={COLORS.blue}
              thickness={2}
              spacing={Math.max(36, chartWidth / Math.max(metricSeries.length, 1) - 12)}
              initialSpacing={20}
              endSpacing={20}
              maxValue={Math.max(...metricSeries.map((point) => point.value), 0) * 1.1 || 1}
              noOfSections={4}
              rulesColor="transparent"
              xAxisColor="transparent"
              yAxisColor="transparent"
              xAxisLabelTextStyle={styles.chartAxisText}
              yAxisTextStyle={styles.chartAxisText}
              dataPointsColor={COLORS.blue}
              dataPointsRadius={3}
              areaChart
              startFillColor={COLORS.blue}
              endFillColor={COLORS.white}
              startOpacity={0.16}
              endOpacity={0.02}
              curved={false}
              pointerConfig={{
                activatePointersInstantlyOnTouch: true,
                pointerStripColor: 'transparent',
                pointerStripWidth: 0,
                pointerLabelComponent: (items: { value?: number; label?: string }[]) => {
                  const point = items?.[0];
                  return (
                    <View style={styles.pointerLabel}>
                      <Text style={styles.pointerLabelText}>{`${selectedMetricLabel}: ${point?.value ?? '—'}`}</Text>
                      <Text style={styles.pointerLabelText}>{point?.label ?? '—'}</Text>
                    </View>
                  );
                },
              }}
            />
          </ScrollView>
        </View>

        {renderComparisonTable()}

        </ScrollView>
        <Modal animationType="slide" transparent visible={metricSelectorVisible} onRequestClose={() => setMetricSelectorVisible(false)}>
          <Pressable style={styles.metricModalBackdrop} onPress={() => setMetricSelectorVisible(false)}>
            <Pressable style={styles.metricModalCard} onPress={(event) => event.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Escolher métrica</Text>
                <Pressable accessibilityLabel="Fechar seletor de métrica" onPress={() => setMetricSelectorVisible(false)} style={styles.modalCloseButton}>
                  <MaterialIcons name="close" size={24} color={COLORS.muted} />
                </Pressable>
              </View>
              {metricCategories.map((category) => (
                <View key={category.title} style={styles.metricCategory}>
                  <Text style={styles.metricCategoryTitle}>{category.title}</Text>
                  {category.options.map((option) => {
                    const isActive = selectedMetric === option.key;
                    return (
                      <Pressable
                        key={option.key}
                        style={[styles.metricOption, isActive && styles.metricOptionActive]}
                        onPress={() => {
                          setSelectedMetric(option.key);
                          setMetricSelectorVisible(false);
                        }}
                      >
                        <Text style={[styles.metricOptionText, isActive && styles.metricOptionTextActive]}>{option.label}</Text>
                        {isActive && <MaterialIcons name="check" size={20} color={COLORS.yellow} />}
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </Pressable>
          </Pressable>
        </Modal>
      </>
    );
  };

  const renderHistoricoTab = () => (
    <>
      <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.studentName}>{aluno?.nome ?? 'Aluno'}</Text>
      <View style={styles.historyHeader}>
        <View>
          <Text style={styles.historyTitle}>Histórico de avaliações</Text>
          <Text style={styles.historyMeta}>Marque duas ou mais avaliações para comparar.</Text>
        </View>
        <Text style={styles.selectionCount}>{selectedHistoryIds.length} selecionada{selectedHistoryIds.length === 1 ? '' : 's'}</Text>
      </View>
      <View style={styles.historyCard}>
        {historicoMedidas.map((item) => {
          const isSelected = selectedHistoryIds.includes(item.id);
          const isActive = selectedHistoryMeasure?.id === item.id;
          return (
            <View key={item.id} style={[styles.historyItem, isActive && styles.historyItemSelected]}>
              <Pressable style={styles.historyItemMain} onPress={() => setSelectedHistoryId(item.id)}>
                <View style={styles.historyItemText}>
                  <Text style={styles.historyDate}>{formatDate(item.data_avaliacao)}</Text>
                  <Text style={styles.historyMeta}>{isActive ? 'Avaliação aberta' : 'Tocar para ver detalhes'}</Text>
                </View>
              </Pressable>
              <Pressable
                accessibilityLabel={`${isSelected ? 'Desmarcar' : 'Marcar'} avaliação de ${formatDate(item.data_avaliacao)}`}
                onPress={() => toggleHistorySelection(item.id)}
                style={styles.checkboxButton}
              >
                <MaterialIcons name={isSelected ? 'check-box' : 'check-box-outline-blank'} size={26} color={isSelected ? COLORS.yellow : COLORS.muted} />
              </Pressable>
            </View>
          );
        })}
      </View>
      {selectedHistoryIds.length >= 2 && (
        <View style={styles.comparisonFilterCard}>
          <View style={styles.comparisonFilterHeader}>
            <View style={styles.comparisonFilterTitleBlock}>
              <Text style={styles.comparisonFilterTitle}>Métricas da comparação</Text>
              <Text style={styles.comparisonFilterText}>
                {selectedComparisonMetrics.length === 0 ? 'Todas as métricas' : `${selectedComparisonMetrics.length} métrica${selectedComparisonMetrics.length === 1 ? '' : 's'} selecionada${selectedComparisonMetrics.length === 1 ? '' : 's'}`}
              </Text>
            </View>
            <Pressable accessibilityLabel="Escolher métricas da comparação" onPress={() => setComparisonMetricSelectorVisible(true)} style={styles.filterButton}>
              <MaterialIcons name="tune" size={20} color={COLORS.yellow} />
            </Pressable>
          </View>
          <Text style={styles.comparisonFilterHint}>Sem filtro, todas as métricas entram na comparação.</Text>
        </View>
      )}
      {selectedHistoryMeasure && (
        <View style={styles.selectedMeasureCard}>
          {renderMeasureDetails(selectedHistoryMeasure, false)}
        </View>
      )}
      </ScrollView>
      <Modal animationType="slide" transparent visible={comparisonMetricSelectorVisible} onRequestClose={() => setComparisonMetricSelectorVisible(false)}>
        <Pressable style={styles.metricModalBackdrop} onPress={() => setComparisonMetricSelectorVisible(false)}>
          <Pressable style={styles.metricModalCard} onPress={(event) => event.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Métricas da comparação</Text>
              <Pressable accessibilityLabel="Fechar filtro de métricas" onPress={() => setComparisonMetricSelectorVisible(false)} style={styles.modalCloseButton}>
                <MaterialIcons name="close" size={24} color={COLORS.muted} />
              </Pressable>
            </View>
            <Text style={styles.formHint}>Selecione uma ou mais métricas. Sem seleção, todas serão usadas.</Text>
            {metricCategories.map((category) => (
              <View key={category.title} style={styles.metricCategory}>
                <Text style={styles.metricCategoryTitle}>{category.title}</Text>
                {category.options.map((option) => {
                  const isActive = selectedComparisonMetrics.includes(option.key);
                  return (
                    <Pressable key={option.key} style={styles.metricOption} onPress={() => toggleComparisonMetric(option.key)}>
                      <Text style={styles.metricOptionText}>{option.label}</Text>
                      <MaterialIcons name={isActive ? 'check-box' : 'check-box-outline-blank'} size={22} color={isActive ? COLORS.yellow : COLORS.muted} />
                    </Pressable>
                  );
                })}
              </View>
            ))}
            <Pressable style={styles.saveButton} onPress={() => setComparisonMetricSelectorVisible(false)}>
              <Text style={styles.saveText}>Aplicar filtro</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );

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
              {(['atual', 'evolucao', 'historico'] as TabType[]).map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <Pressable
                    key={tab}
                    onPress={() => setActiveTab(tab)}
                    style={[styles.tabButton, isActive && styles.tabButtonActive]}
                  >
                    <Text style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}>
                      {tab === 'atual' ? 'Atual' : tab === 'evolucao' ? 'Evolução' : 'Histórico'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {activeTab === 'atual' ? renderAtualTab() : activeTab === 'evolucao' ? renderEvolucaoTab() : renderHistoricoTab()}
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
  checkboxButton: { alignItems: 'center', height: 44, justifyContent: 'center', marginLeft: 8, width: 44 },
  compareButton: { alignItems: 'center', backgroundColor: COLORS.blue, borderRadius: 8, flexDirection: 'row', justifyContent: 'center', marginBottom: 18, minHeight: 44, paddingHorizontal: 16, paddingVertical: 10 },
  compareButtonText: { color: COLORS.white, fontSize: 15, fontWeight: '700', marginLeft: 8 },
  comparisonFilterCard: { backgroundColor: COLORS.white, borderRadius: 12, marginTop: 18, padding: 16 },
  comparisonFilterHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  comparisonFilterHint: { color: COLORS.muted, fontSize: 12, marginTop: 10 },
  comparisonFilterText: { color: COLORS.blue, fontSize: 14, fontWeight: '700', marginTop: 4 },
  comparisonFilterTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  comparisonFilterTitleBlock: { flex: 1 },
  comparisonCard: { backgroundColor: COLORS.paleYellow, borderRadius: 12, marginBottom: 18, padding: 18 },
  comparisonEmptyCard: { backgroundColor: COLORS.white, borderRadius: 12, marginBottom: 18, padding: 18 },
  comparisonEmptyText: { color: COLORS.muted, fontSize: 14, marginBottom: 14, marginTop: 6 },
  comparisonEmptyTitle: { color: COLORS.text, fontSize: 17, fontWeight: '700' },
  comparisonHeaderCell: { alignItems: 'center', borderBottomColor: COLORS.border, borderBottomWidth: StyleSheet.hairlineWidth, borderLeftColor: COLORS.border, borderLeftWidth: StyleSheet.hairlineWidth, height: 48, justifyContent: 'center', width: 104 },
  comparisonHeaderText: { color: COLORS.muted, fontSize: 12, fontWeight: '700', textAlign: 'center' },
  comparisonHorizontalContent: { flexGrow: 1 },
  comparisonMetricCell: { alignItems: 'flex-start', borderBottomColor: COLORS.border, borderBottomWidth: StyleSheet.hairlineWidth, height: 48, justifyContent: 'center', paddingHorizontal: 10 },
  comparisonMetricColumn: { backgroundColor: COLORS.white, elevation: 2, shadowColor: COLORS.text, shadowOffset: { height: 0, width: 2 }, shadowOpacity: 0.08, shadowRadius: 3, width: 128, zIndex: 1 },
  comparisonMetricHeaderCell: { alignItems: 'flex-start', paddingHorizontal: 10, width: 128 },
  comparisonMetricText: { color: COLORS.text, fontSize: 13, fontWeight: '600' },
  comparisonTableCard: { backgroundColor: COLORS.white, borderRadius: 12, marginBottom: 18, padding: 16 },
  comparisonTableFrame: { flexDirection: 'row', marginTop: 14, overflow: 'hidden' },
  comparisonTableRow: { flexDirection: 'row' },
  comparisonTableSubtitle: { color: COLORS.muted, fontSize: 13, marginTop: 4 },
  comparisonTableTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700' },
  comparisonValueCell: { alignItems: 'center', borderBottomColor: COLORS.border, borderBottomWidth: StyleSheet.hairlineWidth, borderLeftColor: COLORS.border, borderLeftWidth: StyleSheet.hairlineWidth, height: 48, justifyContent: 'center', width: 104 },
  comparisonValueText: { color: COLORS.blue, fontSize: 14, fontWeight: '700' },
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
  filterButton: { alignItems: 'center', backgroundColor: COLORS.paleYellow, borderRadius: 8, height: 44, justifyContent: 'center', width: 44 },
  fieldsCard: { backgroundColor: COLORS.white, borderRadius: 10, paddingHorizontal: 16 },
  formHint: { color: COLORS.muted, fontSize: 14, marginBottom: 16 },
  formInput: { borderColor: COLORS.border, borderRadius: 8, borderWidth: 1, color: COLORS.text, fontSize: 16, height: 46, marginBottom: 14, paddingHorizontal: 14 },
  formLabel: { color: COLORS.text, fontSize: 14, fontWeight: '600', marginBottom: 7 },
  header: { alignItems: 'center', backgroundColor: COLORS.white, borderBottomColor: COLORS.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', height: 56, justifyContent: 'space-between' },
  headerButton: { alignItems: 'center', height: 48, justifyContent: 'center', width: 56 },
  headerTitle: { color: COLORS.blue, fontSize: 18, fontWeight: '700' },
  historyCard: { backgroundColor: COLORS.white, borderRadius: 12, padding: 16 },
  historyDate: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  historyHeader: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  historyItem: { alignItems: 'center', borderBottomColor: COLORS.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', minHeight: 64, paddingBottom: 8, paddingTop: 8 },
  historyItemMain: { flex: 1, paddingVertical: 8 },
  historyItemSelected: { backgroundColor: '#EEF5FF', borderRadius: 10, paddingHorizontal: 10 },
  historyItemText: { flex: 1 },
  historyMeta: { color: COLORS.muted, fontSize: 12, marginTop: 4 },
  historyTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700', marginBottom: 8 },
  imcCaption: { color: '#765D2C', fontSize: 13, marginTop: 4 },
  imcCard: { alignItems: 'center', backgroundColor: COLORS.paleYellow, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, marginTop: 20, padding: 20 },
  imcLabel: { color: COLORS.text, fontSize: 24, fontWeight: '800' },
  imcValue: { color: COLORS.blue, fontSize: 30, fontWeight: '800' },
  lastEvaluation: { color: COLORS.muted, fontSize: 14, marginTop: 6 },
  loader: { flex: 1 },
  metricCategory: { marginBottom: 14 },
  metricCategoryTitle: { color: COLORS.muted, fontSize: 13, fontWeight: '800', marginBottom: 6, textTransform: 'uppercase' },
  metricDropdown: { alignItems: 'center', backgroundColor: COLORS.white, borderColor: COLORS.border, borderRadius: 10, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18, minHeight: 44, paddingHorizontal: 16, paddingVertical: 10 },
  metricDropdownLabel: { color: COLORS.muted, fontSize: 12 },
  metricDropdownValue: { color: COLORS.text, fontSize: 16, fontWeight: '700', marginTop: 3 },
  metricModalBackdrop: { backgroundColor: 'rgba(23, 33, 43, 0.4)', flex: 1, justifyContent: 'flex-end' },
  metricModalCard: { backgroundColor: COLORS.white, borderTopLeftRadius: 18, borderTopRightRadius: 18, maxHeight: '92%', padding: 22, paddingBottom: 30 },
  metricOption: { alignItems: 'center', borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', minHeight: 44, paddingHorizontal: 12, paddingVertical: 10 },
  metricOptionActive: { backgroundColor: COLORS.paleYellow },
  metricOptionText: { color: COLORS.text, fontSize: 16 },
  metricOptionTextActive: { color: COLORS.blue, fontWeight: '700' },
  modalBackdrop: { backgroundColor: 'rgba(23, 33, 43, 0.4)', flex: 1, justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.white, borderTopLeftRadius: 18, borderTopRightRadius: 18, maxHeight: '92%', padding: 22, paddingBottom: 30 },
  modalCloseButton: { alignItems: 'center', height: 44, justifyContent: 'center', width: 44 },
  modalHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  modalTitle: { color: COLORS.text, fontSize: 22, fontWeight: '700' },
  pointerLabel: { backgroundColor: 'rgba(23, 33, 43, 0.85)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6 },
  pointerLabelText: { color: COLORS.white, fontSize: 11 },
  safeArea: { backgroundColor: COLORS.background, flex: 1 },
  selectionCount: { color: COLORS.blue, fontSize: 12, fontWeight: '700', marginLeft: 12, textAlign: 'right' },
  saveButton: { alignItems: 'center', backgroundColor: COLORS.blue, borderRadius: 8, height: 50, justifyContent: 'center', marginTop: 8 },
  saveText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  selectedMeasureCard: { backgroundColor: COLORS.white, borderRadius: 12, marginTop: 18, padding: 18 },
  stateBox: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: 24 },
  stateTitle: { color: COLORS.text, fontSize: 17, textAlign: 'center' },
  studentName: { color: COLORS.text, fontSize: 30, fontWeight: '800' },
  tabBar: { backgroundColor: COLORS.white, borderBottomColor: COLORS.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12 },
  tabButton: { alignItems: 'center', backgroundColor: '#EEF3F8', borderRadius: 999, flex: 1, marginRight: 8, minHeight: 44, justifyContent: 'center', paddingVertical: 8 },
  tabButtonActive: { backgroundColor: COLORS.blue },
  tabButtonText: { color: COLORS.text, fontSize: 14, fontWeight: '700' },
  tabButtonTextActive: { color: COLORS.white },
});
