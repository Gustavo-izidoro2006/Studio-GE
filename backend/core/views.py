from rest_framework import viewsets

from .models import Aluno, Exercicio, ItemTreino, Medida, Treino
from .serializers import (
	AlunoSerializer,
	ExercicioSerializer,
	ItemTreinoSerializer,
	MedidaSerializer,
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
