from datetime import date
from decimal import Decimal

from django.db import transaction
from django.db.models import Sum
from django.utils import timezone

from .models import Aluno, Despesa, Mensalidade

ZERO = Decimal('0.00')


def primeiro_dia(ano, mes):
	return date(ano, mes, 1)


def somar_meses(competencia, delta):
	"""Soma (ou subtrai) meses a uma data que é dia 1."""
	indice = competencia.year * 12 + (competencia.month - 1) + delta
	return date(indice // 12, indice % 12 + 1, 1)


def gerar_mensalidades_do_mes():
	"""Cria as mensalidades do mês atual que faltam. Seguro para repetir."""
	competencia = primeiro_dia(timezone.localdate().year, timezone.localdate().month)
	alunos = Aluno.objects.filter(
		ativo=True,
		valor_mensalidade__isnull=False,
		dia_vencimento__isnull=False,
	)
	criadas = 0
	with transaction.atomic():
		for aluno in alunos:
			_, criada = Mensalidade.objects.get_or_create(
				aluno=aluno,
				competencia=competencia,
				defaults={
					'aluno_nome': aluno.nome,
					'valor': aluno.valor_mensalidade,
					'data_vencimento': competencia.replace(day=aluno.dia_vencimento),
				},
			)
			criadas += criada
	return criadas


def _soma(queryset):
	return queryset.aggregate(total=Sum('valor'))['total'] or ZERO


def _total_despesas(competencia):
	proximo = somar_meses(competencia, 1)
	return _soma(Despesa.objects.filter(data__gte=competencia, data__lt=proximo))


def _total_recebido(competencia):
	return _soma(Mensalidade.objects.filter(competencia=competencia, data_pagamento__isnull=False))


def _razao(parte, total):
	if not total:
		return ZERO
	return (Decimal(parte) / Decimal(total)).quantize(Decimal('0.0001'))


def _pendencias(competencia):
	hoje = timezone.localdate()
	nao_pagas = Mensalidade.objects.filter(data_pagamento__isnull=True)
	do_mes = list(nao_pagas.filter(competencia=competencia))
	atrasadas_anteriores = list(nao_pagas.filter(competencia__lt=competencia, data_vencimento__lt=hoje))
	todas = do_mes + atrasadas_anteriores
	# atrasadas primeiro (vencimento mais antigo = maior atraso), depois pendentes por vencimento
	todas.sort(key=lambda m: (m.status != 'atrasado', m.data_vencimento))
	return todas


def resumo_do_mes(competencia):
	mensalidades = Mensalidade.objects.filter(competencia=competencia)
	previsto = _soma(mensalidades)
	recebido = _total_recebido(competencia)
	despesas = _total_despesas(competencia)
	quantidade = mensalidades.count()
	em_atraso = sum(1 for m in mensalidades if m.status == 'atrasado')

	serie = []
	for deslocamento in range(-5, 1):
		mes = somar_meses(competencia, deslocamento)
		serie.append({
			'mes': mes.strftime('%Y-%m'),
			'recebido': _total_recebido(mes),
			'despesas': _total_despesas(mes),
		})

	return {
		'mes': competencia.strftime('%Y-%m'),
		'previsto': previsto,
		'recebido': recebido,
		'a_receber': previsto - recebido,
		'despesas': despesas,
		'saldo': recebido - despesas,
		'percentual_recebido': _razao(recebido, previsto),
		'em_atraso': em_atraso,
		'taxa_inadimplencia': _razao(em_atraso, quantidade),
		'serie': serie,
		'pendencias': _pendencias(competencia),
	}
