from django.db import models
from decimal import Decimal


class Aluno(models.Model):
	nome = models.CharField(max_length=255)
	contato = models.CharField(max_length=255, blank=True)
	data_nascimento = models.DateField(blank=True, null=True)


class Medida(models.Model):
	aluno = models.ForeignKey(Aluno, on_delete=models.CASCADE, related_name='medidas')
	data_avaliacao = models.DateField()
	peso = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True)
	altura = models.DecimalField(max_digits=4, decimal_places=2, blank=True, null=True)
	braco = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True)
	abdomen = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True)
	torax = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True)
	cintura = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True)
	quadril = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True)
	perna = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True)
	suprailiaca = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True)
	subescapular = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True)
	panturrilha = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True)
	triceps = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True)

	@property
	def imc(self):
		if self.peso is None or self.altura is None or self.altura == 0:
			return None
		return (self.peso / (self.altura * self.altura)).quantize(Decimal('0.01'))


class Exercicio(models.Model):
	nome = models.CharField(max_length=255)
	grupo_muscular = models.CharField(max_length=255, blank=True)
	descricao = models.TextField(blank=True)


class Treino(models.Model):
	aluno = models.ForeignKey(Aluno, on_delete=models.CASCADE, related_name='treinos')
	nome = models.CharField(max_length=255)
	observacoes = models.TextField(blank=True)


class ItemTreino(models.Model):
	treino = models.ForeignKey(Treino, on_delete=models.CASCADE, related_name='itens')
	exercicio = models.ForeignKey(Exercicio, on_delete=models.CASCADE, related_name='itens_treino')
	series = models.PositiveIntegerField(blank=True, null=True)
	repeticoes = models.PositiveIntegerField(blank=True, null=True)
	carga = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True)
	adaptacao = models.TextField(blank=True)
