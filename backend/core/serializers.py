from rest_framework import serializers

from .models import Aluno, Exercicio, ItemTreino, Medida, Treino


class AlunoSerializer(serializers.ModelSerializer):
	class Meta:
		model = Aluno
		fields = '__all__'


class MedidaSerializer(serializers.ModelSerializer):
	imc = serializers.ReadOnlyField()

	class Meta:
		model = Medida
		fields = '__all__'
		read_only_fields = ('imc',)


class ExercicioSerializer(serializers.ModelSerializer):
	class Meta:
		model = Exercicio
		fields = '__all__'


class TreinoSerializer(serializers.ModelSerializer):
	class Meta:
		model = Treino
		fields = '__all__'


class ItemTreinoSerializer(serializers.ModelSerializer):
	class Meta:
		model = ItemTreino
		fields = '__all__'
