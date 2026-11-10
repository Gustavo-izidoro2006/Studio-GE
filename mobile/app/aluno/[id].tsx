import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import Animated, { FadeIn, FadeOut, LinearTransition, ReduceMotion, useReducedMotion } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { EmptyState } from '@/components/empty-state';
import { FAB_SPACE, Fab } from '@/components/fab';
import { FieldLabel } from '@/components/field-label';
import { FadeInView } from '@/components/motion';
import { Tag } from '@/components/tag';
import { DateInput } from '@/components/date-input';
import { API_ROOT, comPerfil } from '@/constants/api';
import { usePerfil } from '@/contexts/perfil';
import { converterDataParaISO, dataHojeBrasileira } from '@/utils/date';
import { COLORS, MOTION } from '@/constants/ui';

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
  data_avaliacao: dataHojeBrasileira(),
  peso: '', altura: '', braco: '', abdomen: '', torax: '', cintura: '', quadril: '', perna: '', suprailiaca: '', subescapular: '', panturrilha: '', triceps: '',
};

function formatDate(date: string | null) {
  if (!date) return 'Vazio';
  const [year, month, day] = date.split('-');
  return year && month && day ? `${day}/${month}/${year}` : date;
}


/** Medida com unidade e vírgula ("70,8 kg"); "Vazio" quando não foi medida. */
function displayMetric(value: number | string | null, key: MedidaKey) {
  if (value === null || value === undefined || value === '') return 'Vazio';
  const numero = Number(value);
  return Number.isNaN(numero) ? String(value) : formatarValor(numero, key);
}

function displayImc(value: number | string | null) {
  if (value === null || value === undefined || value === '') return 'Vazio';
  const numero = Number(value);
  return Number.isNaN(numero) ? String(value) : formatarNumero(numero, 1);
}

function responseItems<T>(data: T[] | { results: T[] }): T[] {
  return Array.isArray(data) ? data : data.results;
}

// ---- Apoio à aba Evolução (specs/tela-aluno-v012.md, A3 e A4) ----

const UNIDADES: Record<MedidaKey, string> = {
  peso: 'kg', altura: 'm',
  braco: 'cm', abdomen: 'cm', torax: 'cm', cintura: 'cm', quadril: 'cm', perna: 'cm', panturrilha: 'cm',
  suprailiaca: 'mm', subescapular: 'mm', triceps: 'mm',
};

function casasDecimais(key: MedidaKey) {
  return key === 'altura' ? 2 : 1;
}

/** Número no padrão brasileiro (vírgula), sem depender de Intl. */
function formatarNumero(value: number, casas: number) {
  return value.toFixed(casas).replace('.', ',');
}

function formatarValor(value: number, key: MedidaKey) {
  return `${formatarNumero(value, casasDecimais(key))} ${UNIDADES[key]}`;
}

/** Diferença com sinal: "+0,4 kg", "−0,4 kg" ou "sem mudança". */
function formatarDiferenca(diff: number, key: MedidaKey) {
  const casas = casasDecimais(key);
  if (Math.abs(diff) < 0.5 * 10 ** -casas) return 'sem mudança';
  return `${diff > 0 ? '+' : '−'}${formatarNumero(Math.abs(diff), casas)} ${UNIDADES[key]}`;
}

/** "DD/MM" direto do texto AAAA-MM-DD (sem passar pelo fuso: corrige o dia a menos). */
function formatarDiaMes(iso: string) {
  const [, month, day] = iso.split('-');
  return `${day}/${month}`;
}

function dataLocal(iso: string) {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function diasEntre(inicioIso: string, fimIso: string) {
  return Math.round((dataLocal(fimIso).getTime() - dataLocal(inicioIso).getTime()) / 86400000);
}

/** "hoje", "há 1 dia", "há 9 dias", "há 3 meses". */
function haQuantoTempo(iso: string) {
  const hoje = new Date();
  const hojeIso = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
  const dias = Math.max(0, diasEntre(iso, hojeIso));
  if (dias === 0) return 'hoje';
  if (dias === 1) return 'há 1 dia';
  if (dias < 60) return `há ${dias} dias`;
  return `há ${Math.round(dias / 30.44)} meses`;
}

/** Escala do eixo vertical ajustada à faixa dos dados, com valores redondos. */
function escalaDoGrafico(values: number[]) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const faixa = max - min;
  const folga = faixa > 0 ? faixa * 0.25 : Math.max(Math.abs(max) * 0.05, 1);
  const alvo = (faixa + 2 * folga) / 4;
  // Só passos que geram números redondos no eixo (sem 2,5 ou 0,25).
  const passos = [0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100];
  const passo = passos.find((item) => item >= alvo) ?? 100;
  const inicio = Math.floor((min - folga) / passo) * passo;
  const fim = Math.ceil((max + folga) / passo) * passo;
  return { inicio, passo, secoes: Math.max(1, Math.round((fim - inicio) / passo)) };
}

type PontoGrafico = {
  value: number;
  label: string;
  data: string;
  textoValor: string;
  textoDiferenca: string;
  dataPointText?: string;
  dataPointColor?: string;
  dataPointRadius?: number;
};

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
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { perfilId } = usePerfil();
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
  const [anosAbertos, setAnosAbertos] = useState<string[]>([]);
  const { width: windowWidth } = useWindowDimensions();
  const reduceMotion = useReducedMotion();

  // Histórico agrupado por ano (mais recente primeiro); pastas só aparecem com mais de um ano.
  const historicoPorAno = historicoMedidas.reduce<{ ano: string; itens: Medida[] }[]>((grupos, item) => {
    const ano = item.data_avaliacao.slice(0, 4);
    const grupo = grupos.find((atual) => atual.ano === ano);
    if (grupo) grupo.itens.push(item);
    else grupos.push({ ano, itens: [item] });
    return grupos;
  }, []);

  function toggleAno(ano: string) {
    setAnosAbertos((current) => current.includes(ano) ? current.filter((item) => item !== ano) : [...current, ano]);
  }

  const loadDetails = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [alunoResponse, medidasResponse] = await Promise.all([
        fetch(`${API_ROOT}/alunos/${id}/`),
        fetch(comPerfil(`${API_ROOT}/medidas/?aluno=${id}`, perfilId)),
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
      // A pasta do ano mais recente começa aberta.
      setAnosAbertos((current) => current.length || !medidasOrdenadas.length ? current : [medidasOrdenadas[0].data_avaliacao.slice(0, 4)]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Erro ao carregar medidas.');
    } finally {
      setLoading(false);
    }
  }, [id, perfilId]);

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
    const dataAvaliacao = converterDataParaISO(form.data_avaliacao.trim());
    if (!dataAvaliacao) {
      Alert.alert('Data inválida', 'Informe uma data válida no formato DD/MM/AAAA.');
      return;
    }

    setSaving(true);
    const payload: Record<string, string | number | null> = {
      aluno: Number(id),
      data_avaliacao: dataAvaliacao,
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

  const selectedHistoryMeasure = historicoMedidas.find((item) => item.id === selectedHistoryId) ?? historicoMedidas[0] ?? null;
  const selectedMetricLabel = metricCategories.flatMap((category) => category.options).find((option) => option.key === selectedMetric)?.label ?? 'Peso';
  const comparisonMetricKeys = selectedComparisonMetrics.length === 0 ? measurementKeys : selectedComparisonMetrics;
  const comparisonMeasures = historicoMedidas
    .filter((item) => selectedHistoryIds.includes(item.id))
    .sort((first, second) => first.data_avaliacao.localeCompare(second.data_avaliacao));

  // Só avaliações em que a métrica foi medida, da mais antiga para a mais recente.
  const metricPoints = historicoMedidas
    .slice()
    .sort((first, second) => first.data_avaliacao.localeCompare(second.data_avaliacao))
    .map((item) => {
      const raw = item[selectedMetric];
      const value = raw === null || raw === '' ? NaN : Number(raw);
      return Number.isNaN(value) ? null : { value, data: item.data_avaliacao };
    })
    .filter((item): item is { value: number; data: string } => item !== null);

  const metricSeries: PontoGrafico[] = metricPoints.map((point, index) => {
    const isLast = index === metricPoints.length - 1;
    const previous = index > 0 ? metricPoints[index - 1] : null;
    return {
      value: point.value,
      data: point.data,
      label: formatarDiaMes(point.data),
      textoValor: formatarValor(point.value, selectedMetric),
      textoDiferenca: previous ? formatarDiferenca(point.value - previous.value, selectedMetric) : 'primeira avaliação',
      // Número só no último ponto (o valor atual); os demais aparecem ao tocar e na tabela.
      ...(isLast ? { dataPointText: formatarNumero(point.value, casasDecimais(selectedMetric)), dataPointColor: COLORS.yellow, dataPointRadius: 6 } : {}),
    };
  });

  const renderComparisonTable = () => {
    const comparisonFields = fields.filter((field) => comparisonMetricKeys.includes(field.key));
    if (comparisonMeasures.length < 2) {
      return (
        <View style={styles.comparisonEmptyCard}>
          <Text style={styles.comparisonEmptyTitle}>{comparisonMeasures.length === 0 ? 'Selecione avaliações no Histórico' : 'Selecione mais uma avaliação'}</Text>
          <Text style={styles.comparisonEmptyText}>{comparisonMeasures.length === 0 ? 'Marque duas ou mais avaliações para ver a comparação.' : 'Marque mais uma avaliação para ver a comparação.'}</Text>
          <Pressable accessibilityRole="button" style={styles.compareButtonSecondary} onPress={() => setActiveTab('historico')}>
            <MaterialIcons name="check-box" size={20} color={COLORS.blue} />
            <Text style={styles.compareButtonSecondaryText}>Escolher avaliações</Text>
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
                      <Text style={styles.comparisonValueText}>{displayMetric(measure[field.key], field.key)}</Text>
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
        <Text style={styles.imcValue}>{displayImc(measure?.imc ?? null)}</Text>
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
            <Text style={[styles.fieldValue, (measure?.[field.key] === null || measure?.[field.key] === undefined || measure?.[field.key] === '') && styles.emptyValue]}>{displayMetric(measure?.[field.key] ?? null, field.key)}</Text>
          </View>
        ))}
      </View>
    </>
  );

  const renderSemAvaliacao = (icon: React.ComponentProps<typeof MaterialIcons>['name'], title: string, text: string) => (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.studentHeading}>
        <Avatar nome={aluno?.nome ?? 'Aluno'} size={48} />
        <Text style={[styles.studentName, styles.studentNameInline]}>{aluno?.nome ?? 'Aluno'}</Text>
      </View>
      <EmptyState icon={icon} title={title} text={text} actionLabel="Registrar primeira avaliação" onAction={openMeasureForm} />
    </ScrollView>
  );

  const renderAtualTab = () => historicoMedidas.length === 0 ? renderSemAvaliacao('assignment', 'Nenhuma avaliação ainda', 'Registre a primeira avaliação para acompanhar as medidas e o IMC deste aluno.') : (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: FAB_SPACE }]}>
      <View style={styles.studentHeading}>
        <Avatar nome={aluno?.nome ?? 'Aluno'} size={48} />
        <Text style={[styles.studentName, styles.studentNameInline]}>{aluno?.nome ?? 'Aluno'}</Text>
      </View>
      <Text style={styles.lastEvaluation}>
        Última avaliação: {medida ? `${formatDate(medida.data_avaliacao)} (${haQuantoTempo(medida.data_avaliacao)})` : 'Vazio'}
      </Text>
      <View style={styles.imcCard}>
        <View>
          <Text style={styles.imcLabel}>IMC</Text>
          <Text style={styles.imcCaption}>Índice de massa corporal</Text>
        </View>
        <Text style={styles.imcValue}>{displayImc(medida?.imc ?? null)}</Text>
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
            <Text style={[styles.fieldValue, (medida?.[field.key] === null || medida?.[field.key] === undefined || medida?.[field.key] === '') && styles.emptyValue]}>{displayMetric(medida?.[field.key] ?? null, field.key)}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderVariacao = (label: string, diff: number | null) => {
    const texto = diff === null ? '—' : formatarDiferenca(diff, selectedMetric);
    const icon: React.ComponentProps<typeof MaterialIcons>['name'] = diff === null || texto === 'sem mudança' ? 'remove' : diff < 0 ? 'arrow-downward' : 'arrow-upward';
    return (
      <View style={styles.variacaoRow}>
        <Text style={styles.variacaoLabel}>{label}</Text>
        <View style={styles.variacaoValueWrap}>
          <MaterialIcons name={icon} size={16} color={COLORS.text} />
          <Text style={styles.variacaoValue}>{texto}</Text>
        </View>
      </View>
    );
  };

  const renderEvolucaoTab = () => {
    if (historicoMedidas.length === 0) {
      return renderSemAvaliacao('show-chart', 'Sem avaliações para acompanhar', 'Com duas ou mais avaliações, a evolução de cada medida aparece aqui.');
    }
    if (historicoMedidas.length < 2) {
      return (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: FAB_SPACE }]}>
          <Text style={styles.studentName}>{aluno?.nome ?? 'Aluno'}</Text>
          <EmptyState icon="show-chart" title="Falta mais uma avaliação" text="Com duas ou mais avaliações, a evolução de cada medida aparece aqui." />
        </ScrollView>
      );
    }

    const ultimo = metricPoints[metricPoints.length - 1] ?? null;
    const penultimo = metricPoints.length > 1 ? metricPoints[metricPoints.length - 2] : null;
    const primeiro = metricPoints[0] ?? null;
    const diasTotal = primeiro && ultimo ? diasEntre(primeiro.data, ultimo.data) : 0;
    const meses = diasTotal / 30.44;
    const ritmo = primeiro && ultimo && metricPoints.length > 2 && diasTotal >= 28 ? (ultimo.value - primeiro.value) / meses : null;
    const textoRitmo = ritmo === null ? null : formatarDiferenca(ritmo, selectedMetric);

    const escala = metricSeries.length >= 2 ? escalaDoGrafico(metricSeries.map((point) => point.value)) : null;
    const casasEixo = escala ? (escala.passo < 0.1 ? 2 : escala.passo < 1 ? 1 : 0) : 0;
    // Até 6 avaliações o gráfico cabe na tela; com mais, rola para o lado (abrindo no fim).
    const larguraGrafico = Math.max(220, windowWidth - 40 - 32 - 44);
    const pontosVisiveis = Math.min(Math.max(metricSeries.length, 2), 6);
    const espacamento = (larguraGrafico - 36) / (pontosVisiveis - 1);
    const resumoAcessivel = metricSeries.map((point) => `${formatDate(point.data)}: ${point.textoValor}`).join('; ');

    return (
      <>
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: FAB_SPACE }]}>
        <Text style={styles.studentName}>{aluno?.nome ?? 'Aluno'}</Text>

        <Pressable accessibilityRole="button" style={styles.metricDropdown} onPress={() => setMetricSelectorVisible(true)}>
          <View>
            <Text style={styles.metricDropdownLabel}>Métrica exibida</Text>
            <Text style={styles.metricDropdownValue}>{`${selectedMetricLabel} (${UNIDADES[selectedMetric]})`}</Text>
          </View>
          <MaterialIcons name="keyboard-arrow-down" size={26} color={COLORS.blue} />
        </Pressable>

        <View style={styles.comparisonCard}>
          <Text style={styles.summaryLabel}>{`${selectedMetricLabel} atual`}</Text>
          <Text style={styles.comparisonValue}>{ultimo ? formatarValor(ultimo.value, selectedMetric) : '—'}</Text>
          <Text style={styles.comparisonLabel}>{ultimo ? `em ${formatDate(ultimo.data)}` : 'Medida ainda não registrada'}</Text>
          <View style={styles.summaryDivider} />
          {renderVariacao('Desde a última avaliação', penultimo && ultimo ? ultimo.value - penultimo.value : null)}
          {renderVariacao(primeiro && metricPoints.length > 2 ? `Desde o início (${formatDate(primeiro.data)})` : 'Desde o início', primeiro && ultimo && metricPoints.length > 2 ? ultimo.value - primeiro.value : null)}
          {textoRitmo ? (
            <Text style={styles.summaryRitmo}>
              {textoRitmo === 'sem mudança'
                ? `Ritmo médio: estável em ${Math.max(1, Math.round(meses))} ${Math.round(meses) <= 1 ? 'mês' : 'meses'}`
                : `Ritmo médio: cerca de ${textoRitmo} por mês (${Math.max(1, Math.round(meses))} ${Math.round(meses) <= 1 ? 'mês' : 'meses'})`}
            </Text>
          ) : null}
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>{`${selectedMetricLabel} ao longo do tempo`}</Text>
          {escala ? (
            <>
              <Text style={styles.chartHint}>Toque e arraste no gráfico para ver cada avaliação.</Text>
              <View accessible accessibilityLabel={`${selectedMetricLabel} ao longo do tempo. ${resumoAcessivel}`}>
                <LineChart
                  key={selectedMetric}
                  data={metricSeries}
                  width={larguraGrafico}
                  height={200}
                  spacing={espacamento}
                  initialSpacing={18}
                  endSpacing={18}
                  scrollToEnd
                  color={COLORS.blue}
                  thickness={2}
                  yAxisOffset={escala.inicio}
                  stepValue={escala.passo}
                  noOfSections={escala.secoes}
                  maxValue={escala.passo * escala.secoes}
                  formatYLabel={(label: string) => formatarNumero(Number(label), casasEixo)}
                  yAxisLabelWidth={44}
                  rulesType="solid"
                  rulesColor="#E4E7EA"
                  rulesThickness={1}
                  xAxisColor={COLORS.border}
                  yAxisColor="transparent"
                  xAxisLabelTextStyle={styles.chartAxisText}
                  yAxisTextStyle={styles.chartAxisText}
                  dataPointsColor={COLORS.blue}
                  dataPointsRadius={4}
                  textColor={COLORS.text}
                  textFontSize={12}
                  textShiftY={-8}
                  textShiftX={-10}
                  areaChart
                  startFillColor={COLORS.blue}
                  endFillColor={COLORS.white}
                  startOpacity={0.14}
                  endOpacity={0.02}
                  isAnimated={!reduceMotion}
                  animationDuration={600}
                  pointerConfig={{
                    activatePointersInstantlyOnTouch: true,
                    pointerStripColor: '#B8C4CF',
                    pointerStripWidth: 1,
                    pointerColor: COLORS.yellow,
                    radius: 6,
                    pointerLabelWidth: 136,
                    pointerLabelHeight: 64,
                    autoAdjustPointerLabelPosition: true,
                    pointerLabelComponent: (items: PontoGrafico[]) => {
                      const point = items?.[0];
                      return (
                        <View style={styles.pointerLabel}>
                          <Text style={styles.pointerLabelDate}>{point ? formatDate(point.data) : '—'}</Text>
                          <Text style={styles.pointerLabelText}>{point?.textoValor ?? '—'}</Text>
                          <Text style={styles.pointerLabelSub}>{point?.textoDiferenca ?? ''}</Text>
                        </View>
                      );
                    },
                  }}
                />
              </View>
            </>
          ) : (
            <Text style={styles.comparisonEmptyText}>{`${selectedMetricLabel} foi registrado em menos de duas avaliações. Escolha outra métrica ou registre uma nova avaliação.`}</Text>
          )}
        </View>

        <Pressable accessibilityRole="button" style={styles.compareButtonSecondary} onPress={() => setActiveTab('historico')}>
          <MaterialIcons name="compare-arrows" size={20} color={COLORS.blue} />
          <Text style={styles.compareButtonSecondaryText}>Comparar avaliações</Text>
        </Pressable>
        {renderComparisonTable()}

        </ScrollView>
        <Modal animationType="slide" transparent visible={metricSelectorVisible} onRequestClose={() => setMetricSelectorVisible(false)}>
          <Pressable style={styles.metricModalBackdrop} onPress={() => setMetricSelectorVisible(false)}>
            <Pressable style={[styles.metricModalCard, { paddingBottom: 30 + insets.bottom }]} onPress={(event) => event.stopPropagation()}>
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

  const renderHistoryItem = (item: Medida) => {
    const isSelected = selectedHistoryIds.includes(item.id);
    const isActive = selectedHistoryMeasure?.id === item.id;
    return (
      <View key={item.id} style={[styles.historyItem, isActive && styles.historyItemSelected]}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Abrir avaliação de ${formatDate(item.data_avaliacao)}`} style={styles.historyItemMain} onPress={() => setSelectedHistoryId(item.id)}>
          <View style={styles.historyItemText}>
            <Text style={styles.historyDate}>{formatDate(item.data_avaliacao)}</Text>
            <Text style={styles.historyMeta}>{isActive ? 'Avaliação aberta' : 'Tocar para ver detalhes'}</Text>
          </View>
        </Pressable>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isSelected }}
          accessibilityLabel={`${isSelected ? 'Desmarcar' : 'Marcar'} avaliação de ${formatDate(item.data_avaliacao)}`}
          onPress={() => toggleHistorySelection(item.id)}
          style={styles.checkboxButton}
        >
          <MaterialIcons name={isSelected ? 'check-box' : 'check-box-outline-blank'} size={26} color={isSelected ? COLORS.yellow : COLORS.muted} />
        </Pressable>
      </View>
    );
  };

  const renderHistoricoTab = () => historicoMedidas.length === 0 ? renderSemAvaliacao('history', 'Histórico vazio', 'Cada avaliação registrada fica guardada aqui, organizada por data.') : (
    <>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: FAB_SPACE }]}>
      <Text style={styles.studentName}>{aluno?.nome ?? 'Aluno'}</Text>
      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle}>Histórico de avaliações</Text>
        <Text style={styles.historyMeta}>Marque duas ou mais avaliações para comparar.</Text>
        <Tag
          style={styles.selectionTag}
          tone={selectedHistoryIds.length ? 'yellow' : 'neutral'}
          icon={selectedHistoryIds.length ? 'check-box' : 'check-box-outline-blank'}
          label={`${selectedHistoryIds.length} selecionada${selectedHistoryIds.length === 1 ? '' : 's'}`}
        />
      </View>
      <View style={styles.historyCard}>
        {historicoPorAno.length <= 1
          ? historicoMedidas.map(renderHistoryItem)
          : historicoPorAno.map(({ ano, itens }) => {
            const aberto = anosAbertos.includes(ano);
            const marcadas = itens.filter((item) => selectedHistoryIds.includes(item.id)).length;
            const resumo = `${itens.length} avaliaç${itens.length === 1 ? 'ão' : 'ões'}${marcadas ? ` · ${marcadas} marcada${marcadas === 1 ? '' : 's'}` : ''}`;
            return (
              <Animated.View key={ano} layout={LinearTransition.duration(MOTION.base).reduceMotion(ReduceMotion.System)}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: aberto }}
                  accessibilityLabel={`Avaliações de ${ano}, ${resumo}`}
                  onPress={() => toggleAno(ano)}
                  style={[styles.yearFolder, aberto && styles.yearFolderOpen]}>
                  <MaterialIcons name={aberto ? 'folder-open' : 'folder'} size={22} color={aberto ? COLORS.blue : COLORS.muted} />
                  <Text style={[styles.yearFolderTitle, aberto && styles.yearFolderTitleOpen]}>{ano}</Text>
                  <Text style={styles.yearFolderMeta}>{resumo}</Text>
                  <MaterialIcons name={aberto ? 'expand-less' : 'expand-more'} size={22} color={aberto ? COLORS.blue : COLORS.muted} />
                </Pressable>
                {aberto ? (
                  <Animated.View
                    entering={FadeIn.duration(MOTION.base).reduceMotion(ReduceMotion.System)}
                    exiting={FadeOut.duration(MOTION.fast).reduceMotion(ReduceMotion.System)}
                    style={styles.yearFolderItems}>
                    {itens.map(renderHistoryItem)}
                  </Animated.View>
                ) : null}
              </Animated.View>
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
          <Pressable style={[styles.metricModalCard, { paddingBottom: 30 + insets.bottom }]} onPress={(event) => event.stopPropagation()}>
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
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Voltar" onPress={() => router.back()} style={styles.headerButton}>
            <MaterialIcons name="arrow-back" size={24} color={COLORS.blue} />
          </Pressable>
          <Text style={styles.headerTitle}>Medidas</Text>
          {/* Espaço do mesmo tamanho do botão voltar, para o título ficar centralizado. */}
          <View style={styles.headerButton} />
        </View>
        {loading ? <ActivityIndicator color={COLORS.blue} size="large" style={styles.loader} /> : error ? (
          <View style={styles.stateBox}><Text style={styles.stateTitle}>{error}</Text></View>
        ) : (
          <>
            <View accessibilityRole="tablist" style={styles.tabBar}>
              {(['atual', 'evolucao', 'historico'] as TabType[]).map((tab) => {
                const isActive = activeTab === tab;
                const label = tab === 'atual' ? 'Atual' : tab === 'evolucao' ? 'Evolução' : 'Histórico';
                return (
                  <Pressable
                    key={tab}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: isActive }}
                    accessibilityLabel={label}
                    onPress={() => setActiveTab(tab)}
                    style={[styles.tabButton, isActive && styles.tabButtonActive]}
                  >
                    <Text style={[styles.tabButtonText, isActive && styles.tabButtonTextActive]}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>
            <FadeInView key={activeTab} style={styles.tabContent}>
              {activeTab === 'atual' ? renderAtualTab() : activeTab === 'evolucao' ? renderEvolucaoTab() : renderHistoricoTab()}
            </FadeInView>
          </>
        )}
      </SafeAreaView>
      {!loading && !error && historicoMedidas.length > 0 ? (
        <Fab accessibilityLabel="Registrar nova avaliação" label="Nova avaliação" onPress={openMeasureForm} bottomOffset={insets.bottom} />
      ) : null}
      <Modal animationType="slide" transparent visible={formVisible} onRequestClose={() => setFormVisible(false)}>
        <KeyboardAvoidingView behavior="padding" style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { paddingBottom: 30 + insets.bottom }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nova avaliação</Text>
              <Pressable accessibilityLabel="Fechar formulário" onPress={() => setFormVisible(false)}>
                <MaterialIcons name="close" size={24} color={COLORS.muted} />
              </Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.formHint}>Preencha apenas os campos disponíveis.</Text>
              <FieldLabel required style={styles.formLabel}>Data da avaliação</FieldLabel>
              <DateInput accessibilityLabel="Data da avaliação" value={form.data_avaliacao} onChangeText={(data_avaliacao) => setForm((current) => ({ ...current, data_avaliacao }))} style={styles.formInput} />
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
  chartAxisText: { color: COLORS.muted, fontSize: 11 },
  chartCard: { backgroundColor: COLORS.white, borderRadius: 12, marginBottom: 18, padding: 16 },
  chartHint: { color: COLORS.muted, fontSize: 13, marginBottom: 14, marginTop: -6 },
  chartTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700', marginBottom: 12 },
  checkboxButton: { alignItems: 'center', height: 44, justifyContent: 'center', marginLeft: 8, width: 44 },
  compareButtonSecondary: { alignItems: 'center', backgroundColor: COLORS.white, borderColor: COLORS.blue, borderRadius: 8, borderWidth: 1.5, flexDirection: 'row', justifyContent: 'center', marginBottom: 18, minHeight: 44, paddingHorizontal: 16, paddingVertical: 10 },
  compareButtonSecondaryText: { color: COLORS.blue, fontSize: 15, fontWeight: '700', marginLeft: 8 },
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
  historyHeader: { marginBottom: 12, marginTop: 4 },
  selectionTag: { marginTop: 10 },
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
  pointerLabel: { backgroundColor: COLORS.text, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  pointerLabelDate: { color: '#C9D3DC', fontSize: 11 },
  pointerLabelSub: { color: '#C9D3DC', fontSize: 11, marginTop: 1 },
  pointerLabelText: { color: COLORS.white, fontSize: 14, fontWeight: '700', marginTop: 1 },
  studentHeading: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  studentNameInline: { flex: 1, fontSize: 26 },
  summaryDivider: { backgroundColor: '#EBD9B4', height: StyleSheet.hairlineWidth, marginVertical: 12 },
  summaryLabel: { color: COLORS.yellowText, fontSize: 13, fontWeight: '600', marginBottom: 2 },
  summaryRitmo: { color: COLORS.yellowText, fontSize: 13, lineHeight: 18, marginTop: 10 },
  tabContent: { flex: 1 },
  variacaoLabel: { color: COLORS.yellowText, flex: 1, fontSize: 14 },
  variacaoRow: { alignItems: 'center', flexDirection: 'row', minHeight: 30 },
  variacaoValue: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  variacaoValueWrap: { alignItems: 'center', flexDirection: 'row', gap: 2 },
  yearFolder: { alignItems: 'center', borderColor: COLORS.border, borderRadius: 10, borderWidth: 1, flexDirection: 'row', gap: 8, marginTop: 8, minHeight: 48, paddingHorizontal: 12 },
  yearFolderItems: { paddingLeft: 10 },
  yearFolderMeta: { color: COLORS.muted, flex: 1, fontSize: 13, textAlign: 'right' },
  yearFolderOpen: { backgroundColor: COLORS.blueLight, borderColor: COLORS.blueLight },
  yearFolderTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  yearFolderTitleOpen: { color: COLORS.blueDark },
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
