from rest_framework import serializers

from .models import Aluno, Despesa, Exercicio, ItemTreino, Medida, Mensalidade, Treino


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


class MensalidadeSerializer(serializers.ModelSerializer):
	status = serializers.ReadOnlyField()
	dias_atraso = serializers.ReadOnlyField()

	class Meta:
		model = Mensalidade
		fields = '__all__'


class SerieMensalSerializer(serializers.Serializer):
	mes = serializers.CharField()
	recebido = serializers.DecimalField(max_digits=12, decimal_places=2)
	despesas = serializers.DecimalField(max_digits=12, decimal_places=2)


class ResumoFinanceiroSerializer(serializers.Serializer):
	# Serializer com DecimalField garante dinheiro como texto exato ("100.10"), nunca float.
	mes = serializers.CharField()
	previsto = serializers.DecimalField(max_digits=12, decimal_places=2)
	recebido = serializers.DecimalField(max_digits=12, decimal_places=2)
	a_receber = serializers.DecimalField(max_digits=12, decimal_places=2)
	despesas = serializers.DecimalField(max_digits=12, decimal_places=2)
	saldo = serializers.DecimalField(max_digits=12, decimal_places=2)
	percentual_recebido = serializers.DecimalField(max_digits=6, decimal_places=4)
	em_atraso = serializers.IntegerField()
	taxa_inadimplencia = serializers.DecimalField(max_digits=6, decimal_places=4)
	serie = SerieMensalSerializer(many=True)
	pendencias = MensalidadeSerializer(many=True)


class DespesaSerializer(serializers.ModelSerializer):
	class Meta:
		model = Despesa
		fields = '__all__'
