from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone
from decimal import Decimal


class Aluno(models.Model):
	TURNO_CHOICES = [
		('manha', 'Manhã'),
		('tarde', 'Tarde'),
		('noite', 'Noite'),
	]

	nome = models.CharField(max_length=255)
	contato = models.CharField(max_length=255, blank=True)
	data_nascimento = models.DateField(blank=True, null=True)
	turno = models.CharField(max_length=20, choices=TURNO_CHOICES, default='manha')
	valor_mensalidade = models.DecimalField(max_digits=8, decimal_places=2, blank=True, null=True)
	dia_vencimento = models.PositiveSmallIntegerField(
		blank=True,
		null=True,
		validators=[MinValueValidator(1), MaxValueValidator(28)],
	)
	ativo = models.BooleanField(default=True)

	def clean(self):
		if self.valor_mensalidade is not None and self.dia_vencimento is None:
			raise ValidationError({'dia_vencimento': 'Informe o dia de vencimento.'})


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


class Mensalidade(models.Model):
	aluno = models.ForeignKey(Aluno, on_delete=models.SET_NULL, blank=True, null=True, related_name='mensalidades')
	aluno_nome = models.CharField(max_length=255)
	competencia = models.DateField()
	valor = models.DecimalField(max_digits=8, decimal_places=2)
	data_vencimento = models.DateField()
	data_pagamento = models.DateField(blank=True, null=True)

	class Meta:
		ordering = ['-competencia', 'aluno_nome']
		constraints = [
			models.UniqueConstraint(fields=['aluno', 'competencia'], name='mensalidade_unica_por_aluno_mes'),
		]

	def clean(self):
		if self.competencia and self.competencia.day != 1:
			raise ValidationError({'competencia': 'A competência deve ser o dia 1 do mês.'})

	def save(self, *args, **kwargs):
		if not self.aluno_nome and self.aluno:
			self.aluno_nome = self.aluno.nome
		super().save(*args, **kwargs)

	@property
	def status(self):
		if self.data_pagamento:
			return 'pago'
		if self.data_vencimento < timezone.localdate():
			return 'atrasado'
		return 'pendente'

	@property
	def dias_atraso(self):
		if self.status != 'atrasado':
			return 0
		return (timezone.localdate() - self.data_vencimento).days

	def __str__(self):
		return f'{self.aluno_nome} - {self.competencia:%m/%Y}'


class Despesa(models.Model):
	CATEGORIA_CHOICES = [
		('aluguel', 'Aluguel'),
		('energia_agua', 'Energia e água'),
		('salarios', 'Salários'),
		('equipamentos', 'Equipamentos'),
		('manutencao', 'Manutenção'),
		('marketing', 'Marketing'),
		('outros', 'Outros'),
	]

	descricao = models.CharField(max_length=255)
	categoria = models.CharField(max_length=20, choices=CATEGORIA_CHOICES)
	valor = models.DecimalField(max_digits=8, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
	data = models.DateField()

	class Meta:
		ordering = ['-data']

	def __str__(self):
		return self.descricao
