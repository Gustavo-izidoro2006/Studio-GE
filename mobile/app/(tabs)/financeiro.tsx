import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect, useNavigation } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import Animated, { FadeInDown, FadeOut, LinearTransition, ReduceMotion, interpolateColor, useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FieldLabel } from '@/components/field-label';
import { PressableScale } from '@/components/pressable-scale';
import { CATEGORIA_ICON } from '@/components/tag';
import { DateInput } from '@/components/date-input';
import { API_ROOT, comPerfil } from '@/constants/api';
import { usePerfil } from '@/contexts/perfil';
import { converterDataParaISO, dataHojeBrasileira, formatarDataParaEntrada } from '@/utils/date';
import { COLORS, MOTION } from '@/constants/ui';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

type SerieItem = { mes: string; recebido: string; despesas: string };
type Pendencia = {
  id: number;
  aluno_nome: string;
  valor: string;
  data_vencimento: string;
  status: 'pago' | 'atrasado' | 'pendente';
  dias_atraso: number;
};
type Resumo = {
  mes: string;
  previsto: string;
  recebido: string;
  a_receber: string;
  despesas: string;
  saldo: string;
  percentual_recebido: string;
  em_atraso: number;
  taxa_inadimplencia: string;
  serie: SerieItem[];
  pendencias: Pendencia[];
};
type Despesa = { id: number; descricao: string; categoria: string; valor: string; data: string };
type Pagamento = { id: number; aluno_nome: string; valor: string; data_pagamento: string };
type DespesaForm = { descricao: string; categoria: string; valor: string; data: string };

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const CATEGORIAS: Array<{ value: string; label: string }> = [
  { value: 'aluguel', label: 'Aluguel' },
  { value: 'energia_agua', label: 'Energia e água' },
  { value: 'salarios', label: 'Salários' },
  { value: 'equipamentos', label: 'Equipamentos' },
  { value: 'manutencao', label: 'Manutenção' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'outros', label: 'Outros' },
];

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function mesAtual() {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${pad(hoje.getMonth() + 1)}`;
}

function somarMes(mes: string, delta: number) {
  const [ano, m] = mes.split('-').map(Number);
  const data = new Date(ano, m - 1 + delta, 1);
  return `${data.getFullYear()}-${pad(data.getMonth() + 1)}`;
}

function nomeDoMes(mes: string) {
  const [ano, m] = mes.split('-').map(Number);
  return `${MESES[m - 1]} de ${ano}`;
}

function mesAbreviado(mes: string) {
  return MESES[Number(mes.split('-')[1]) - 1].slice(0, 3);
}

// Formato brasileiro sem depender de Intl: R$ 4.850,00 / −R$ 300,00.
function dinheiro(valor: string | number) {
  const n = Number(valor);
  const [inteiro, centavos] = Math.abs(n).toFixed(2).split('.');
  const milhares = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${n < 0 ? '−' : ''}R$ ${milhares},${centavos}`;
}

function formatarData(iso: string) {
  const [ano, mes, dia] = iso.split('-');
  return `${dia}/${mes}/${ano}`;
}

function formatarDataHora(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  });
}

function normalizarBusca(valor: string) {
  return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
}

function diasAteVencer(iso: string) {
  const [ano, mes, dia] = iso.split('-').map(Number);
  const hoje = new Date();
  const base = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  return Math.round((new Date(ano, mes - 1, dia).getTime() - base.getTime()) / 86400000);
}

function situacao(p: Pendencia): { texto: string; icone: IconName; atrasado: boolean } {
  if (p.status === 'atrasado') {
    return { texto: `Atrasado há ${p.dias_atraso} ${p.dias_atraso === 1 ? 'dia' : 'dias'}`, icone: 'warning', atrasado: true };
  }
  const dias = diasAteVencer(p.data_vencimento);
  if (dias <= 0) return { texto: 'Vence hoje', icone: 'schedule', atrasado: false };
  return { texto: `Vence em ${dias} ${dias === 1 ? 'dia' : 'dias'}`, icone: 'schedule', atrasado: false };
}

function categoriaLabel(value: string) {
  return CATEGORIAS.find((c) => c.value === value)?.label ?? value;
}

// Linha de pendência: ao marcar "Pago", dá um flash verde com "Pago" e sai da lista (G6.4).
function PendenciaRow({ p, index, pagando, onPagar }: { p: Pendencia; index: number; pagando: boolean; onPagar: () => void }) {
  const s = situacao(p);
  const flash = useSharedValue(0);
  useEffect(() => {
    if (pagando) flash.value = withSequence(withTiming(1, { duration: 140 }), withTiming(0.7, { duration: 260 }));
  }, [pagando, flash]);
  const fundo = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(flash.value, [0, 1], ['rgba(223,241,227,0)', COLORS.lightGreen]) }));

  return (
    <Animated.View
      entering={index < MOTION.staggerMax ? FadeInDown.duration(MOTION.base).delay(index * MOTION.stagger).reduceMotion(ReduceMotion.System) : undefined}
      exiting={FadeOut.duration(MOTION.base).reduceMotion(ReduceMotion.System)}
      layout={LinearTransition.duration(MOTION.base).reduceMotion(ReduceMotion.System)}
      style={[styles.pendRow, fundo]}>
      <MaterialIcons name={pagando ? 'check-circle' : s.icone} size={22} color={pagando ? COLORS.green : s.atrasado ? COLORS.danger : COLORS.muted} />
      <View style={styles.pendCopy}>
        <Text style={styles.pendName}>{p.aluno_nome}</Text>
        <Text style={[styles.pendStatus, s.atrasado && !pagando && { color: COLORS.danger }, pagando && { color: COLORS.green }]}>{pagando ? 'Pago' : s.texto}</Text>
      </View>
      <Text style={styles.pendValue}>{dinheiro(p.valor)}</Text>
      <PressableScale accessibilityRole="button" accessibilityLabel={`Marcar ${p.aluno_nome} como pago`} disabled={pagando} onPress={onPagar} pressedScale={0.94} style={[styles.payButton, pagando && styles.payButtonDone]}>
        {pagando ? <MaterialIcons name="check" size={20} color={COLORS.white} /> : <Text style={styles.payText}>Pago</Text>}
      </PressableScale>
    </Animated.View>
  );
}

async function pedir<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error('Falha na requisição.');
  return response.status === 204 ? (undefined as T) : ((await response.json()) as T);
}

const POST: RequestInit = { method: 'POST' };

export default function FinanceiroScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const [mes, setMes] = useState(mesAtual);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [aviso, setAviso] = useState<{ id: number; texto: string } | null>(null);
  const avisoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [barraSelecionada, setBarraSelecionada] = useState<number | null>(null);
  const [pagandoId, setPagandoId] = useState<number | null>(null);
  const reduceMotion = useReducedMotion();

  const [formVisible, setFormVisible] = useState(false);
  const [editando, setEditando] = useState<Despesa | null>(null);
  const [form, setForm] = useState<DespesaForm>({ descricao: '', categoria: 'outros', valor: '', data: dataHojeBrasileira() });
  const [saving, setSaving] = useState(false);
  const [listaVisible, setListaVisible] = useState(false);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [listaLoading, setListaLoading] = useState(false);
  const [historicoVisible, setHistoricoVisible] = useState(false);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [buscaHistorico, setBuscaHistorico] = useState('');
  const [historicoLoading, setHistoricoLoading] = useState(false);
  const [historicoError, setHistoricoError] = useState(false);

  const { perfilId } = usePerfil();

  // Tudo do financeiro é do perfil ativo (specs/perfis.md).
  const carregar = useCallback(async (alvo: string, silencioso = false) => {
    if (!silencioso) setLoading(true);
    setError(false);
    try {
      // Garante que as mensalidades do mês atual existam antes de somar (a API não gera sozinha no resumo).
      if (alvo === mesAtual()) await pedir(comPerfil(`${API_ROOT}/financeiro/gerar-mensalidades/`, perfilId), POST);
      setResumo(await pedir<Resumo>(comPerfil(`${API_ROOT}/financeiro/resumo/?mes=${alvo}`, perfilId)));
      setBarraSelecionada(null);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [perfilId]);

  useFocusEffect(
    useCallback(() => {
      void carregar(mes, true);
    }, [carregar, mes]),
  );

  useEffect(() => {
    setLoading(true);
  }, [mes, perfilId]);

  useEffect(() => () => {
    if (avisoTimer.current) clearTimeout(avisoTimer.current);
  }, []);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable accessibilityRole="button" accessibilityLabel="Adicionar despesa" onPress={abrirNovaDespesa} style={styles.headerAction}>
          <MaterialIcons name="add" size={22} color={COLORS.blue} />
          <Text style={styles.headerActionText}>Despesa</Text>
        </Pressable>
      ),
    });
    // abrirNovaDespesa só usa setters de estado, que são estáveis.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation]);

  function abrirNovaDespesa() {
    setEditando(null);
    setForm({ descricao: '', categoria: 'outros', valor: '', data: dataHojeBrasileira() });
    setFormVisible(true);
  }

  function abrirEdicao(despesa: Despesa) {
    setEditando(despesa);
    setForm({ descricao: despesa.descricao, categoria: despesa.categoria, valor: despesa.valor.replace('.', ','), data: formatarDataParaEntrada(despesa.data) });
    setFormVisible(true);
  }

  async function salvarDespesa() {
    const descricao = form.descricao.trim();
    const valor = Number(form.valor.trim().replace(',', '.'));
    if (!descricao) return Alert.alert('Descrição obrigatória', 'Informe a descrição da despesa.');
    if (!Number.isFinite(valor) || valor <= 0) return Alert.alert('Valor inválido', 'Informe um valor maior que zero, por exemplo 120,00.');
    const data = converterDataParaISO(form.data.trim());
    if (!data) return Alert.alert('Data inválida', 'Informe uma data válida no formato DD/MM/AAAA.');

    setSaving(true);
    try {
      await pedir(editando ? `${API_ROOT}/despesas/${editando.id}/` : comPerfil(`${API_ROOT}/despesas/`, perfilId), {
        method: editando ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descricao, categoria: form.categoria, valor: valor.toFixed(2), data }),
      });
      setFormVisible(false);
      await carregar(mes, true);
      if (listaVisible) await carregarDespesas();
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar a despesa.');
    } finally {
      setSaving(false);
    }
  }

  async function carregarDespesas() {
    setListaLoading(true);
    try {
      setDespesas(await pedir<Despesa[]>(comPerfil(`${API_ROOT}/despesas/?mes=${mes}`, perfilId)));
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar as despesas.');
    } finally {
      setListaLoading(false);
    }
  }

  function abrirLista() {
    setListaVisible(true);
    void carregarDespesas();
  }

  async function carregarHistorico() {
    setHistoricoLoading(true);
    setHistoricoError(false);
    try {
      setPagamentos(await pedir<Pagamento[]>(comPerfil(`${API_ROOT}/mensalidades/?pagas=true`, perfilId)));
    } catch {
      setHistoricoError(true);
    } finally {
      setHistoricoLoading(false);
    }
  }

  function abrirHistorico() {
    setBuscaHistorico('');
    setHistoricoVisible(true);
    void carregarHistorico();
  }

  function opcoesDespesa(despesa: Despesa) {
    Alert.alert(despesa.descricao, dinheiro(despesa.valor), [
      { text: 'Editar', onPress: () => abrirEdicao(despesa) },
      { text: 'Excluir', style: 'destructive', onPress: () => confirmarExclusao(despesa) },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  function confirmarExclusao(despesa: Despesa) {
    Alert.alert('Excluir despesa', `Deseja excluir "${despesa.descricao}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await pedir(`${API_ROOT}/despesas/${despesa.id}/`, { method: 'DELETE' });
            await Promise.all([carregarDespesas(), carregar(mes, true)]);
          } catch {
            Alert.alert('Erro', 'Não foi possível excluir a despesa.');
          }
        },
      },
    ]);
  }

  function mostrarAviso(id: number) {
    if (avisoTimer.current) clearTimeout(avisoTimer.current);
    setAviso({ id, texto: 'Marcado como pago' });
    avisoTimer.current = setTimeout(() => setAviso(null), 6000);
  }

  async function marcarPago(p: Pendencia) {
    setPagandoId(p.id);
    try {
      // O flash verde fica visível um instante antes de o item sair da lista.
      await Promise.all([pedir(`${API_ROOT}/mensalidades/${p.id}/pagar/`, POST), new Promise((done) => setTimeout(done, reduceMotion ? 0 : 420))]);
      mostrarAviso(p.id);
      await carregar(mes, true);
    } catch {
      Alert.alert('Erro', 'Não foi possível marcar como pago.');
    } finally {
      setPagandoId(null);
    }
  }

  async function desfazer() {
    if (!aviso) return;
    const { id } = aviso;
    setAviso(null);
    try {
      await pedir(`${API_ROOT}/mensalidades/${id}/desfazer-pagamento/`, POST);
      await carregar(mes, true);
    } catch {
      Alert.alert('Erro', 'Não foi possível desfazer.');
    }
  }

  const noMesAtual = mes === mesAtual();

  const seletorMes = (
    <View style={styles.monthRow}>
      <Pressable accessibilityLabel="Mês anterior" onPress={() => setMes(somarMes(mes, -1))} style={styles.monthArrow}>
        <MaterialIcons name="chevron-left" size={30} color={COLORS.blue} />
      </Pressable>
      <Text style={styles.monthText}>{nomeDoMes(mes)}</Text>
      <Pressable
        accessibilityLabel="Próximo mês"
        accessibilityState={{ disabled: noMesAtual }}
        disabled={noMesAtual}
        onPress={() => setMes(somarMes(mes, 1))}
        style={styles.monthArrow}
      >
        <MaterialIcons name="chevron-right" size={30} color={noMesAtual ? COLORS.border : COLORS.blue} />
      </Pressable>
    </View>
  );

  function conteudo(r: Resumo) {
    const saldo = Number(r.saldo);
    const percentual = Math.round(Number(r.percentual_recebido) * 100);
    const taxa = Number(r.taxa_inadimplencia);
    // A API não devolve o total de mensalidades; ele sai de em_atraso / taxa.
    const totalMensalidades = taxa > 0 ? Math.round(r.em_atraso / taxa) : 0;
    const textoAtraso = r.em_atraso === 0 ? 'Nenhum aluno em atraso (0%)' : `${r.em_atraso} de ${totalMensalidades} em atraso (${Math.round(taxa * 100)}%)`;
    const semMensalidades = Number(r.previsto) === 0 && r.pendencias.length === 0;

    const maximo = Math.max(100, ...r.serie.flatMap((s) => [Number(s.recebido), Number(s.despesas)]));
    const barras = r.serie.flatMap((s) => [
      { value: Number(s.recebido), frontColor: COLORS.blue, spacing: 4, label: mesAbreviado(s.mes), labelWidth: 40, labelTextStyle: styles.chartLabel },
      { value: Number(s.despesas), frontColor: COLORS.yellow, spacing: 22 },
    ]);
    const resumoGrafico = r.serie.map((s) => `${mesAbreviado(s.mes)}: receita ${dinheiro(s.recebido)}, despesa ${dinheiro(s.despesas)}`).join('. ');
    const sel = barraSelecionada === null ? null : r.serie[barraSelecionada];

    const cartoes: Array<{ rotulo: string; valor: string; icone: IconName; fundo: string }> = [
      { rotulo: 'Recebido', valor: dinheiro(r.recebido), icone: 'check-circle', fundo: COLORS.lightGreen },
      { rotulo: 'Despesas', valor: dinheiro(r.despesas), icone: 'receipt', fundo: COLORS.lightYellow },
      { rotulo: 'Saldo', valor: dinheiro(r.saldo), icone: saldo < 0 ? 'arrow-downward' : 'arrow-upward', fundo: saldo < 0 ? COLORS.lightRed : COLORS.lightBlue },
      { rotulo: 'A receber', valor: dinheiro(r.a_receber), icone: 'schedule', fundo: COLORS.lightBlue },
    ];

    return (
      <>
        <View style={styles.cards}>
          {cartoes.map((c) => (
            <View key={c.rotulo} accessible accessibilityLabel={`${c.rotulo}: ${c.valor}`} style={[styles.card, { backgroundColor: c.fundo }]}>
              <View style={styles.cardHeader}>
                <MaterialIcons name={c.icone} size={20} color={COLORS.text} />
                <Text style={styles.cardLabel}>{c.rotulo}</Text>
              </View>
              <Text style={styles.cardValue}>{c.valor}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressText}>Previsto no mês: {dinheiro(r.previsto)}</Text>
            <Text style={styles.progressPercent}>{percentual}% recebido</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.min(100, percentual)}%` }]} />
          </View>
          <Text style={styles.progressSmall}>{textoAtraso}</Text>
          <Pressable accessibilityRole="button" onPress={abrirHistorico} style={styles.historyLink}>
            <MaterialIcons name="history" size={20} color={COLORS.blue} />
            <Text style={styles.linkText}>Histórico de pagamentos</Text>
            <MaterialIcons name="chevron-right" size={24} color={COLORS.blue} />
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Receita x despesa</Text>
          <View accessible accessibilityLabel={`Gráfico dos últimos 6 meses. ${resumoGrafico}`}>
            <BarChart
              data={barras}
              barWidth={14}
              initialSpacing={10}
              endSpacing={0}
              width={width - 32 - 32}
              height={160}
              maxValue={maximo}
              noOfSections={4}
              hideYAxisText
              yAxisThickness={0}
              rulesColor={COLORS.border}
              xAxisColor={COLORS.border}
              disableScroll
              barBorderTopLeftRadius={3}
              barBorderTopRightRadius={3}
              onPress={(_: unknown, index: number) => setBarraSelecionada(Math.floor(index / 2))}
            />
          </View>
          <View style={styles.legend}>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: COLORS.blue }]} /><Text style={styles.legendText}>Receita</Text></View>
            <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: COLORS.yellow }]} /><Text style={styles.legendText}>Despesa</Text></View>
          </View>
          <Text style={styles.chartHint}>
            {sel ? `${nomeDoMes(sel.mes)}: receita ${dinheiro(sel.recebido)}, despesa ${dinheiro(sel.despesas)}` : 'Toque numa barra para ver o valor exato.'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pagamentos em atraso{r.em_atraso > 0 ? ` (${r.em_atraso})` : ''}</Text>
          {semMensalidades ? (
            <Text style={styles.emptyText}>Nenhuma mensalidade neste mês. Informe o valor da mensalidade nos alunos.</Text>
          ) : r.pendencias.length === 0 ? (
            <View style={styles.okRow}>
              <MaterialIcons name="check-circle" size={22} color={COLORS.green} />
              <Text style={styles.okText}>Tudo em dia</Text>
            </View>
          ) : (
            r.pendencias.map((p, index) => (
              <PendenciaRow key={p.id} p={p} index={index} pagando={pagandoId === p.id} onPagar={() => void marcarPago(p)} />
            ))
          )}
        </View>

        <Pressable accessibilityRole="button" onPress={abrirLista} style={styles.linkRow}>
          <MaterialIcons name="list-alt" size={22} color={COLORS.blue} />
          <Text style={styles.linkText}>Ver despesas do mês</Text>
          <MaterialIcons name="chevron-right" size={24} color={COLORS.blue} />
        </Pressable>
      </>
    );
  }

  const totalDespesas = despesas.reduce((soma, d) => soma + Number(d.valor), 0);
  const termoBuscaHistorico = normalizarBusca(buscaHistorico.trim());
  const pagamentosFiltrados = pagamentos.filter((pagamento) =>
    normalizarBusca(pagamento.aluno_nome).includes(termoBuscaHistorico),
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {seletorMes}
        {loading ? (
          <ActivityIndicator color={COLORS.blue} size="large" style={styles.loader} />
        ) : error || !resumo ? (
          <View style={styles.stateBox}>
            <MaterialIcons name="cloud-off" size={46} color={COLORS.blue} />
            <Text style={styles.stateTitle}>Não foi possível carregar o financeiro</Text>
            <Pressable onPress={() => void carregar(mes)} style={styles.retryButton}>
              <Text style={styles.retryText}>Tentar de novo</Text>
            </Pressable>
          </View>
        ) : (
          conteudo(resumo)
        )}
      </ScrollView>

      {aviso && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{aviso.texto} ·</Text>
          <Pressable accessibilityRole="button" onPress={() => void desfazer()} style={styles.toastAction}>
            <Text style={styles.toastActionText}>Desfazer</Text>
          </Pressable>
        </View>
      )}

      <Modal animationType="slide" transparent visible={formVisible} onRequestClose={() => setFormVisible(false)}>
        <KeyboardAvoidingView behavior="padding" style={styles.modalBackdrop}>
          <ScrollView style={styles.modalScroll} contentContainerStyle={[styles.modalCard, { paddingBottom: 32 + insets.bottom }]} keyboardShouldPersistTaps="handled">
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editando ? 'Editar despesa' : 'Nova despesa'}</Text>
              <Pressable accessibilityLabel="Fechar" onPress={() => setFormVisible(false)} style={styles.closeButton}>
                <MaterialIcons name="close" size={24} color={COLORS.muted} />
              </Pressable>
            </View>
            <FieldLabel required style={styles.label}>Descrição</FieldLabel>
            <TextInput value={form.descricao} onChangeText={(descricao) => setForm((c) => ({ ...c, descricao }))} placeholder="Ex.: Aluguel de outubro" placeholderTextColor="#9AA4AD" style={styles.input} />
            <FieldLabel required style={styles.label}>Categoria</FieldLabel>
            <View style={styles.chips}>
              {CATEGORIAS.map((c) => {
                const ativo = form.categoria === c.value;
                return (
                  <Pressable key={c.value} onPress={() => setForm((f) => ({ ...f, categoria: c.value }))} style={[styles.chip, ativo && styles.chipActive]}>
                    <Text style={[styles.chipText, ativo && styles.chipTextActive]}>{c.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            <FieldLabel required style={styles.label}>Valor (R$)</FieldLabel>
            <TextInput value={form.valor} onChangeText={(valor) => setForm((c) => ({ ...c, valor }))} keyboardType="decimal-pad" placeholder="120,00" placeholderTextColor="#9AA4AD" style={styles.input} />
            <FieldLabel required style={styles.label}>Data</FieldLabel>
            <DateInput accessibilityLabel="Data da despesa" value={form.data} onChangeText={(data) => setForm((c) => ({ ...c, data }))} style={styles.input} />
            <Pressable disabled={saving} onPress={() => void salvarDespesa()} style={styles.saveButton}>
              {saving ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveText}>Salvar despesa</Text>}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <Modal animationType="slide" visible={listaVisible} onRequestClose={() => setListaVisible(false)}>
        <View style={[styles.listaContainer, { paddingBottom: 16 + insets.bottom }]}>
          <View style={styles.listaHeader}>
            <View>
              <Text style={styles.modalTitle}>Despesas de {nomeDoMes(mes)}</Text>
              <Text style={styles.listaTotal}>Total: {dinheiro(totalDespesas)}</Text>
            </View>
            <Pressable accessibilityLabel="Fechar" onPress={() => setListaVisible(false)} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={COLORS.muted} />
            </Pressable>
          </View>
          {listaLoading ? (
            <ActivityIndicator color={COLORS.blue} size="large" style={styles.loader} />
          ) : (
            <FlatList
              data={despesas}
              keyExtractor={(d) => String(d.id)}
              ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma despesa neste mês.</Text>}
              renderItem={({ item }) => (
                <Pressable accessibilityRole="button" accessibilityHint="Toque para editar ou excluir" onPress={() => opcoesDespesa(item)} style={styles.despesaRow}>
                  <View style={styles.categoryIcon}>
                    <MaterialIcons name={CATEGORIA_ICON[item.categoria] ?? 'more-horiz'} size={20} color={COLORS.yellowText} />
                  </View>
                  <View style={styles.pendCopy}>
                    <Text style={styles.pendName}>{item.descricao}</Text>
                    <Text style={styles.pendStatus}>{categoriaLabel(item.categoria)} · {formatarData(item.data)}</Text>
                  </View>
                  <Text style={styles.pendValue}>{dinheiro(item.valor)}</Text>
                </Pressable>
              )}
            />
          )}
          <Pressable onPress={abrirNovaDespesa} style={styles.saveButton}>
            <Text style={styles.saveText}>+ Despesa</Text>
          </Pressable>
        </View>
      </Modal>

      <Modal animationType="slide" visible={historicoVisible} onRequestClose={() => setHistoricoVisible(false)}>
        <View style={[styles.listaContainer, { paddingBottom: 16 + insets.bottom }]}>
          <View style={styles.listaHeader}>
            <View>
              <Text style={styles.modalTitle}>Histórico de pagamentos</Text>
              <Text style={styles.listaTotal}>Mensalidades pagas</Text>
            </View>
            <Pressable accessibilityLabel="Fechar" onPress={() => setHistoricoVisible(false)} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={COLORS.muted} />
            </Pressable>
          </View>
          <View style={styles.historySearch}>
            <MaterialIcons name="search" size={22} color={COLORS.muted} />
            <TextInput
              accessibilityLabel="Buscar pagamento pelo nome do aluno"
              onChangeText={setBuscaHistorico}
              placeholder="Buscar aluno pelo nome"
              placeholderTextColor="#9AA4AD"
              returnKeyType="search"
              style={styles.historySearchInput}
              value={buscaHistorico}
            />
            {buscaHistorico.length > 0 && (
              <Pressable
                accessibilityLabel="Limpar busca"
                onPress={() => setBuscaHistorico('')}
                style={styles.historySearchClear}
              >
                <MaterialIcons name="close" size={20} color={COLORS.muted} />
              </Pressable>
            )}
          </View>
          {historicoLoading ? (
            <ActivityIndicator color={COLORS.blue} size="large" style={styles.loader} />
          ) : historicoError ? (
            <View style={styles.stateBox}>
              <Text style={styles.emptyText}>Não foi possível carregar o histórico.</Text>
              <Pressable accessibilityRole="button" onPress={() => void carregarHistorico()} style={styles.retryButton}>
                <Text style={styles.retryText}>Tentar de novo</Text>
              </Pressable>
            </View>
          ) : (
            <FlatList
              data={pagamentosFiltrados}
              keyExtractor={(pagamento) => String(pagamento.id)}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  {buscaHistorico.trim() ? 'Nenhum pagamento encontrado para esse aluno.' : 'Nenhum pagamento registrado.'}
                </Text>
              }
              renderItem={({ item }) => (
                <View style={styles.despesaRow}>
                  <MaterialIcons name="check-circle-outline" size={22} color={COLORS.green} />
                  <View style={styles.pendCopy}>
                    <Text style={styles.pendName}>{item.aluno_nome}</Text>
                    <Text style={styles.pendStatus}>Pago em {formatarDataHora(item.data_pagamento)}</Text>
                  </View>
                  <Text style={styles.pendValue}>{dinheiro(item.valor)}</Text>
                </View>
              )}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 10, flexBasis: '48%', flexGrow: 1, minHeight: 84, padding: 12 },
  cardHeader: { alignItems: 'center', flexDirection: 'row' },
  cardLabel: { color: COLORS.text, fontSize: 14, fontWeight: '600', marginLeft: 6 },
  cardValue: { color: COLORS.text, fontSize: 19, fontWeight: '700', marginTop: 10 },
  cards: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  chartHint: { color: COLORS.text, fontSize: 14, marginTop: 6 },
  chartLabel: { color: COLORS.muted, fontSize: 12 },
  chip: { backgroundColor: COLORS.white, borderColor: COLORS.border, borderRadius: 999, borderWidth: 1, justifyContent: 'center', minHeight: 44, paddingHorizontal: 14 },
  chipActive: { backgroundColor: COLORS.blue, borderColor: COLORS.blue },
  chipText: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  chipTextActive: { color: COLORS.white },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  closeButton: { alignItems: 'center', height: 44, justifyContent: 'center', width: 44 },
  container: { backgroundColor: COLORS.background, flex: 1 },
  despesaRow: { alignItems: 'center', borderBottomColor: COLORS.border, borderBottomWidth: 1, flexDirection: 'row', minHeight: 64, paddingVertical: 8 },
  emptyText: { color: COLORS.muted, fontSize: 15, paddingVertical: 12 },
  headerAction: { alignItems: 'center', flexDirection: 'row', height: 44, justifyContent: 'center', minWidth: 44, paddingHorizontal: 10 },
  headerActionText: { color: COLORS.blue, fontSize: 15, fontWeight: '700' },
  historySearch: { alignItems: 'center', backgroundColor: COLORS.background, borderColor: COLORS.border, borderRadius: 8, borderWidth: 1, flexDirection: 'row', marginBottom: 8, minHeight: 48, paddingHorizontal: 12 },
  historySearchClear: { alignItems: 'center', height: 44, justifyContent: 'center', width: 44 },
  historySearchInput: { color: COLORS.text, flex: 1, fontSize: 16, minHeight: 44, paddingHorizontal: 10 },
  historyLink: { alignItems: 'center', borderTopColor: COLORS.border, borderTopWidth: 1, flexDirection: 'row', marginTop: 12, minHeight: 44, paddingTop: 8 },
  input: { backgroundColor: COLORS.white, borderColor: COLORS.border, borderRadius: 8, borderWidth: 1, color: COLORS.text, fontSize: 16, height: 48, marginBottom: 16, paddingHorizontal: 14 },
  label: { color: COLORS.text, fontSize: 14, fontWeight: '600', marginBottom: 7 },
  legend: { flexDirection: 'row', gap: 16, marginTop: 10 },
  legendDot: { borderRadius: 2, height: 12, marginRight: 6, width: 12 },
  legendItem: { alignItems: 'center', flexDirection: 'row' },
  legendText: { color: COLORS.text, fontSize: 13 },
  linkRow: { alignItems: 'center', backgroundColor: COLORS.white, borderColor: COLORS.border, borderRadius: 10, borderWidth: 1, flexDirection: 'row', minHeight: 52, paddingHorizontal: 14 },
  linkText: { color: COLORS.blue, flex: 1, fontSize: 16, fontWeight: '700', marginLeft: 10 },
  listaContainer: { backgroundColor: COLORS.white, flex: 1, padding: 16, paddingTop: 40 },
  listaHeader: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  listaTotal: { color: COLORS.muted, fontSize: 16, fontWeight: '600', marginTop: 4 },
  loader: { marginTop: 40 },
  modalBackdrop: { backgroundColor: 'rgba(23, 33, 43, 0.35)', flex: 1, justifyContent: 'flex-end' },
  modalCard: { padding: 22, paddingBottom: 32 },
  modalHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  modalScroll: { backgroundColor: COLORS.white, borderTopLeftRadius: 18, borderTopRightRadius: 18, flexGrow: 0, maxHeight: '90%' },
  modalTitle: { color: COLORS.text, fontSize: 20, fontWeight: '700' },
  monthArrow: { alignItems: 'center', height: 48, justifyContent: 'center', width: 48 },
  monthRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  monthText: { color: COLORS.text, fontSize: 18, fontWeight: '700', textTransform: 'capitalize' },
  okRow: { alignItems: 'center', flexDirection: 'row', gap: 8, paddingVertical: 12 },
  okText: { color: COLORS.green, fontSize: 16, fontWeight: '700' },
  payButton: { alignItems: 'center', backgroundColor: COLORS.blue, borderRadius: 8, justifyContent: 'center', marginLeft: 10, minHeight: 44, minWidth: 56, paddingHorizontal: 12 },
  payText: { color: COLORS.white, fontSize: 14, fontWeight: '700' },
  payButtonDone: { backgroundColor: COLORS.green },
  categoryIcon: { alignItems: 'center', backgroundColor: COLORS.paleYellow, borderRadius: 18, height: 36, justifyContent: 'center', width: 36 },
  pendCopy: { flex: 1, marginLeft: 10 },
  pendName: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  pendRow: { alignItems: 'center', borderBottomColor: COLORS.border, borderBottomWidth: 1, flexDirection: 'row', minHeight: 64, paddingVertical: 8 },
  pendStatus: { color: COLORS.muted, fontSize: 13, marginTop: 2 },
  pendValue: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  progressFill: { backgroundColor: COLORS.blue, borderRadius: 6, height: 12 },
  progressHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressPercent: { color: COLORS.blue, fontSize: 14, fontWeight: '700' },
  progressSmall: { color: COLORS.muted, fontSize: 13, marginTop: 8 },
  progressText: { color: COLORS.text, flex: 1, fontSize: 14, fontWeight: '600' },
  progressTrack: { backgroundColor: COLORS.border, borderRadius: 6, height: 12, overflow: 'hidden' },
  retryButton: { alignItems: 'center', backgroundColor: COLORS.blue, borderRadius: 8, justifyContent: 'center', marginTop: 18, minHeight: 48, paddingHorizontal: 20 },
  retryText: { color: COLORS.white, fontWeight: '700' },
  saveButton: { alignItems: 'center', backgroundColor: COLORS.blue, borderRadius: 8, height: 50, justifyContent: 'center', marginTop: 12 },
  saveText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  scroll: { padding: 16, paddingBottom: 40 },
  section: { backgroundColor: COLORS.white, borderColor: COLORS.border, borderRadius: 10, borderWidth: 1, marginBottom: 16, padding: 14 },
  sectionTitle: { color: COLORS.text, fontSize: 17, fontWeight: '700', marginBottom: 10 },
  stateBox: { alignItems: 'center', padding: 30 },
  stateTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700', marginTop: 12, textAlign: 'center' },
  toast: { alignItems: 'center', backgroundColor: COLORS.text, borderRadius: 10, bottom: 16, flexDirection: 'row', left: 16, minHeight: 48, paddingLeft: 16, position: 'absolute', right: 16 },
  toastAction: { alignItems: 'center', justifyContent: 'center', minHeight: 44, minWidth: 44, paddingHorizontal: 10 },
  toastActionText: { color: COLORS.yellow, fontSize: 15, fontWeight: '700' },
  toastText: { color: COLORS.white, fontSize: 15 },
});
