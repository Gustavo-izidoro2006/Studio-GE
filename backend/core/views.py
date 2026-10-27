from datetime import datetime

from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action, api_view
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from . import financeiro
from .models import Aluno, Despesa, Exercicio, ItemTreino, Medida, Mensalidade, Treino
from .serializers import (
	AlunoSerializer,
	DespesaSerializer,
	ExercicioSerializer,
	ItemTreinoSerializer,
	MedidaSerializer,
	MensalidadeSerializer,
	ResumoFinanceiroSerializer,
	TreinoSerializer,
)


class AlunoViewSet(viewsets.ModelViewSet):
	queryset = Aluno.objects.all()
	serializer_class = AlunoSerializer


class MedidaViewSet(viewsets.ModelViewSet):
	queryset = Medida.objects.order_by('-data_avaliacao', '-id')
	serializer_class = MedidaSerializer


class ExercicioViewSet(viewsets.ModelViewSet):
	queryset = Exercicio.objects.all()
	serializer_class = ExercicioSerializer


class TreinoViewSet(viewsets.ModelViewSet):
	queryset = Treino.objects.all()
	serializer_class = TreinoSerializer


class ItemTreinoViewSet(viewsets.ModelViewSet):
	queryset = ItemTreino.objects.all()
	serializer_class = ItemTreinoSerializer


def ler_mes(valor):
	"""Converte 'YYYY-MM' no dia 1 daquele mês. Sem valor, usa o mês atual."""
	if not valor:
		hoje = timezone.localdate()
		return hoje.replace(day=1)
	try:
		return datetime.strptime(valor, '%Y-%m').date()
	except ValueError:
		raise ValidationError({'mes': 'Use o formato AAAA-MM, por exemplo 2026-10.'})


class MensalidadeViewSet(viewsets.ReadOnlyModelViewSet):
	queryset = Mensalidade.objects.all()
	serializer_class = MensalidadeSerializer

	def get_queryset(self):
		queryset = super().get_queryset()
		mes = self.request.query_params.get('mes')
		if mes:
			queryset = queryset.filter(competencia=ler_mes(mes))
		return queryset

	@action(detail=True, methods=['post'])
	def pagar(self, request, pk=None):
		mensalidade = self.get_object()
		mensalidade.data_pagamento = timezone.localdate()
		mensalidade.save(update_fields=['data_pagamento'])
		return Response(self.get_serializer(mensalidade).data)

	@action(detail=True, methods=['post'], url_path='desfazer-pagamento')
	def desfazer_pagamento(self, request, pk=None):
		mensalidade = self.get_object()
		mensalidade.data_pagamento = None
		mensalidade.save(update_fields=['data_pagamento'])
		return Response(self.get_serializer(mensalidade).data)


class DespesaViewSet(viewsets.ModelViewSet):
	queryset = Despesa.objects.order_by('-data', '-id')
	serializer_class = DespesaSerializer

	def get_queryset(self):
		queryset = super().get_queryset()
		mes = self.request.query_params.get('mes')
		if mes:
			inicio = ler_mes(mes)
			queryset = queryset.filter(data__gte=inicio, data__lt=financeiro.somar_meses(inicio, 1))
		return queryset


@api_view(['POST'])
def gerar_mensalidades(request):
	criadas = financeiro.gerar_mensalidades_do_mes()
	return Response({'criadas': criadas})


@api_view(['GET'])
def resumo_financeiro(request):
	resumo = financeiro.resumo_do_mes(ler_mes(request.query_params.get('mes')))
	return Response(ResumoFinanceiroSerializer(resumo).data)
