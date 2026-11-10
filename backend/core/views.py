from datetime import datetime

from django.db.models import Count
from django.utils import timezone
from rest_framework import mixins, viewsets
from rest_framework.decorators import action, api_view
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from . import financeiro
from .models import Aluno, Despesa, Exercicio, ItemTreino, Medida, Mensalidade, Perfil, Treino, perfil_padrao
from .serializers import (
	AlunoSerializer,
	DespesaSerializer,
	ExercicioSerializer,
	ItemTreinoSerializer,
	MedidaSerializer,
	MensalidadeSerializer,
	PerfilSerializer,
	ResumoFinanceiroSerializer,
	TreinoSerializer,
)


def perfil_da_requisicao(request):
	"""Perfil indicado em ?perfil=<id> (ou no corpo). Sem indicação, Academia (compatível com o APK 0.1.1)."""
	valor = request.query_params.get('perfil')
	if valor in (None, '') and hasattr(request, 'data') and isinstance(request.data, dict):
		valor = request.data.get('perfil')
	if valor in (None, ''):
		return Perfil.objects.get(pk=perfil_padrao())
	try:
		return Perfil.objects.get(pk=int(valor))
	except (TypeError, ValueError, Perfil.DoesNotExist):
		raise ValidationError({'perfil': 'Perfil inexistente.'})


class PorPerfilMixin:
	"""Listas mostram só o perfil pedido; itens criados sem perfil ficam no perfil pedido.

	Buscar, editar e excluir por id não filtram, para links e telas de detalhe nunca quebrarem.
	"""

	campo_perfil = 'perfil'

	def get_queryset(self):
		queryset = super().get_queryset()
		if self.action == 'list':
			queryset = queryset.filter(**{self.campo_perfil: perfil_da_requisicao(self.request)})
		return queryset

	def perform_create(self, serializer):
		if 'perfil' in serializer.validated_data or self.campo_perfil != 'perfil':
			serializer.save()
		else:
			serializer.save(perfil=perfil_da_requisicao(self.request))


class PerfilViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.UpdateModelMixin, viewsets.GenericViewSet):
	"""Os três perfis são fixos: só listar, ver e renomear."""

	queryset = Perfil.objects.annotate(total_alunos=Count('alunos')).order_by('id')
	serializer_class = PerfilSerializer


class AlunoViewSet(PorPerfilMixin, viewsets.ModelViewSet):
	queryset = Aluno.objects.all()
	serializer_class = AlunoSerializer


class MedidaViewSet(PorPerfilMixin, viewsets.ModelViewSet):
	queryset = Medida.objects.order_by('-data_avaliacao', '-id')
	serializer_class = MedidaSerializer
	campo_perfil = 'aluno__perfil'

	def get_queryset(self):
		aluno = self.request.query_params.get('aluno')
		if aluno:
			# As avaliações de um aluno seguem o perfil dele, não o perfil ativo no app.
			return Medida.objects.order_by('-data_avaliacao', '-id').filter(aluno_id=aluno)
		return super().get_queryset()


class ExercicioViewSet(PorPerfilMixin, viewsets.ModelViewSet):
	queryset = Exercicio.objects.all()
	serializer_class = ExercicioSerializer


class TreinoViewSet(PorPerfilMixin, viewsets.ModelViewSet):
	queryset = Treino.objects.all()
	serializer_class = TreinoSerializer
	campo_perfil = 'aluno__perfil'


class ItemTreinoViewSet(PorPerfilMixin, viewsets.ModelViewSet):
	queryset = ItemTreino.objects.all()
	serializer_class = ItemTreinoSerializer
	campo_perfil = 'treino__aluno__perfil'


def ler_mes(valor):
	"""Converte 'YYYY-MM' no dia 1 daquele mês. Sem valor, usa o mês atual."""
	if not valor:
		hoje = timezone.localdate()
		return hoje.replace(day=1)
	try:
		return datetime.strptime(valor, '%Y-%m').date()
	except ValueError:
		raise ValidationError({'mes': 'Use o formato AAAA-MM, por exemplo 2026-10.'})


class MensalidadeViewSet(PorPerfilMixin, viewsets.ReadOnlyModelViewSet):
	queryset = Mensalidade.objects.all()
	serializer_class = MensalidadeSerializer

	def get_queryset(self):
		queryset = super().get_queryset()
		mes = self.request.query_params.get('mes')
		if mes:
			queryset = queryset.filter(competencia=ler_mes(mes))
		if self.request.query_params.get('pagas') == 'true':
			queryset = queryset.filter(data_pagamento__isnull=False).order_by('-data_pagamento', '-id')
		return queryset

	@action(detail=True, methods=['post'])
	def pagar(self, request, pk=None):
		mensalidade = self.get_object()
		mensalidade.data_pagamento = timezone.now()
		mensalidade.save(update_fields=['data_pagamento'])
		return Response(self.get_serializer(mensalidade).data)

	@action(detail=True, methods=['post'], url_path='desfazer-pagamento')
	def desfazer_pagamento(self, request, pk=None):
		mensalidade = self.get_object()
		mensalidade.data_pagamento = None
		mensalidade.save(update_fields=['data_pagamento'])
		return Response(self.get_serializer(mensalidade).data)


class DespesaViewSet(PorPerfilMixin, viewsets.ModelViewSet):
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
	criadas = financeiro.gerar_mensalidades_do_mes(perfil_da_requisicao(request))
	return Response({'criadas': criadas})


@api_view(['GET'])
def resumo_financeiro(request):
	resumo = financeiro.resumo_do_mes(ler_mes(request.query_params.get('mes')), perfil_da_requisicao(request))
	return Response(ResumoFinanceiroSerializer(resumo).data)
