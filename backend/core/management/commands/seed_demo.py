"""Cria dados FICTÍCIOS de demonstração (ver specs/dados-demonstracao.md).

Uso:
    python manage.py seed_demo            # recria os dados de demonstração
    python manage.py seed_demo --limpar   # só remove os dados de demonstração

Seguro para repetir: remove o que ele mesmo criou antes de criar de novo.
Não toca em nenhum outro aluno, mensalidade ou despesa do banco.
"""
import random
from datetime import date, datetime, time, timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from core.financeiro import somar_meses
from core.models import Aluno, Despesa, Exercicio, ItemTreino, Medida, Mensalidade, Perfil, Treino

# nome, turno, nascimento, valor, dia de vencimento, mês de início (0 = atual, -5 = há 5 meses),
# último mês cobrado (None = segue ativo), ativo
ALUNOS = [
	('Helena Duarte Campos', 'manha', date(1958, 3, 12), '240.00', 5, -5, None, True),
	('Rogério Mendes Lima', 'manha', date(1962, 7, 22), '240.00', 5, -5, None, True),
	('Beatriz Nogueira Costa', 'tarde', date(1998, 11, 4), '300.00', 10, -5, None, True),
	('Lucas Ferraz Andrade', 'tarde', date(2010, 2, 9), '260.00', 10, -4, None, True),
	('Marcos Vinícius Teles', 'noite', date(1985, 9, 30), '350.00', 15, -5, None, True),
	('Camila Rezende Prado', 'noite', date(1992, 1, 17), '300.00', 15, -4, None, True),
	('Aparecida Souza Ribeiro', 'manha', date(1951, 12, 2), '240.00', 8, -5, None, True),
	('Felipe Araújo Brito', 'tarde', date(2008, 8, 25), '260.00', 12, -3, None, True),
	('Juliana Moraes Pinto', 'manha', date(1989, 4, 14), '350.00', 20, -3, None, True),
	('Thiago Barros Leal', 'noite', date(1979, 6, 8), '350.00', 20, -2, None, True),
	('Patrícia Lemos Vaz', 'tarde', date(1975, 10, 21), '300.00', 25, -2, None, True),
	('Gabriel Sampaio Rocha', 'manha', date(2003, 3, 3), '300.00', 3, -1, None, True),
	('Sônia Maria Tavares', 'tarde', date(1955, 2, 28), None, None, 0, None, True),  # cortesia
	('Ricardo Pires Neto', 'noite', date(1990, 12, 15), '300.00', 15, -5, -3, False),  # inativo
	# Perfil Personal: atendimentos em outras academias ou em casa
	('Renata Albuquerque', 'manha', date(1984, 6, 2), '520.00', 7, -3, None, True),
	('Paulo Henrique Matos', 'noite', date(1971, 9, 14), '480.00', 12, -2, None, True),
	('Sandra Queiroz', 'tarde', date(1960, 1, 25), '600.00', 18, -3, None, True),
	# Perfil Pessoal: o próprio treino e o de um amigo (sem mensalidade)
	('Treino próprio (instrutor)', 'noite', None, None, None, 0, None, True),
	('Rafael Nunes (amigo)', 'noite', date(1995, 4, 9), None, None, 0, None, True),
]
NOMES_DEMO = [linha[0] for linha in ALUNOS]

# Perfil de cada aluno de demonstração (os não listados ficam em Academia)
PERFIL_DO_ALUNO = {
	'Renata Albuquerque': 'personal',
	'Paulo Henrique Matos': 'personal',
	'Sandra Queiroz': 'personal',
	'Treino próprio (instrutor)': 'pessoal',
	'Rafael Nunes (amigo)': 'pessoal',
}

# Mensalidades de meses anteriores que ficaram em aberto (aparecem como atrasadas)
EM_ABERTO_MES_ANTERIOR = {'Marcos Vinícius Teles', 'Thiago Barros Leal'}
# No mês atual: quem ainda não pagou mesmo com o vencimento já passado
ATRASADO_NO_MES_ATUAL = {'Camila Rezende Prado'}
# No mês atual: quem pagou adiantado (antes do vencimento)
PAGOU_ADIANTADO = {'Helena Duarte Campos', 'Rogério Mendes Lima', 'Beatriz Nogueira Costa',
	'Juliana Moraes Pinto', 'Gabriel Sampaio Rocha', 'Renata Albuquerque'}

EXERCICIOS = [
	('Agachamento livre', 'Pernas', 'Agachamento com barra ou peso corporal, descendo com a coluna neutra.'),
	('Leg press 45°', 'Pernas', 'Empurrar a plataforma sem travar totalmente os joelhos.'),
	('Cadeira extensora', 'Pernas', 'Extensão de joelhos na máquina, movimento controlado.'),
	('Mesa flexora', 'Pernas', 'Flexão dos joelhos deitado, foco na parte posterior da coxa.'),
	('Panturrilha em pé', 'Panturrilha', 'Elevação dos calcanhares em pé, com pausa no topo.'),
	('Supino reto com halteres', 'Peito', 'Empurrar os halteres a partir do peito, deitado no banco.'),
	('Crucifixo na máquina', 'Peito', 'Abrir e fechar os braços com cotovelos levemente flexionados.'),
	('Puxada frontal', 'Costas', 'Puxar a barra até a altura do peito, escápulas para baixo.'),
	('Remada baixa', 'Costas', 'Puxar o triângulo em direção ao abdômen, peito aberto.'),
	('Desenvolvimento com halteres', 'Ombros', 'Elevar os halteres acima da cabeça, sentado.'),
	('Elevação lateral', 'Ombros', 'Elevar os braços até a altura dos ombros com carga leve.'),
	('Rosca direta', 'Bíceps', 'Flexão dos cotovelos com barra ou halteres, sem balançar o tronco.'),
	('Tríceps na polia', 'Tríceps', 'Extensão dos cotovelos puxando a corda para baixo.'),
	('Prancha abdominal', 'Abdômen', 'Isometria apoiada nos antebraços, corpo alinhado.'),
	('Abdominal infra', 'Abdômen', 'Elevação das pernas deitado, lombar apoiada.'),
	('Ponte de glúteos', 'Glúteos', 'Elevar o quadril deitado, contraindo os glúteos no topo.'),
	('Caminhada na esteira', 'Cardio', 'Caminhada em ritmo constante, inclinação leve.'),
	('Bicicleta ergométrica', 'Cardio', 'Pedalada contínua em ritmo confortável.'),
]

# aluno -> lista de (nome do treino, observações, [(exercício, séries, repetições, carga, adaptação)])
TREINOS = {
	'Helena Duarte Campos': [
		('Treino A — Adaptado (60+)', 'Evitar impacto; priorizar equilíbrio e mobilidade.', [
			('Leg press 45°', 3, 12, '40.00', 'Amplitude reduzida, sem travar os joelhos.'),
			('Cadeira extensora', 3, 12, '15.00', 'Movimento lento, sem balançar.'),
			('Puxada frontal', 3, 12, '20.00', ''),
			('Ponte de glúteos', 3, 15, None, 'Apoiar bem os pés; pausa de 2 segundos no topo.'),
			('Bicicleta ergométrica', 1, 15, None, 'Ritmo leve, 15 minutos.'),
		]),
	],
	'Aparecida Souza Ribeiro': [
		('Treino adaptado — Mobilidade', 'Séries curtas e descansos longos. Observar a respiração.', [
			('Caminhada na esteira', 1, 10, None, 'Sem inclinação, 10 minutos, com apoio nas barras.'),
			('Leg press 45°', 2, 12, '30.00', 'Carga leve, amplitude confortável.'),
			('Remada baixa', 2, 12, '15.00', 'Tronco ereto, sem inclinar.'),
			('Elevação lateral', 2, 12, '1.00', 'Halteres leves, até a altura dos ombros.'),
		]),
	],
	'Beatriz Nogueira Costa': [
		('Treino A — Pernas e glúteos', 'Foco em força de membros inferiores.', [
			('Agachamento livre', 4, 12, '30.00', ''),
			('Leg press 45°', 4, 12, '90.00', ''),
			('Mesa flexora', 3, 12, '25.00', ''),
			('Ponte de glúteos', 4, 15, '20.00', ''),
			('Panturrilha em pé', 4, 15, '40.00', ''),
		]),
		('Treino B — Superiores', 'Costas, ombros e braços.', [
			('Puxada frontal', 4, 12, '35.00', ''),
			('Remada baixa', 3, 12, '30.00', ''),
			('Desenvolvimento com halteres', 3, 12, '8.00', ''),
			('Rosca direta', 3, 12, '12.00', ''),
			('Tríceps na polia', 3, 12, '15.00', ''),
		]),
	],
	'Marcos Vinícius Teles': [
		('Treino de emagrecimento — Full body', 'Circuito com pouco descanso entre os exercícios.', [
			('Agachamento livre', 3, 15, '20.00', ''),
			('Supino reto com halteres', 3, 15, '14.00', ''),
			('Remada baixa', 3, 15, '35.00', ''),
			('Prancha abdominal', 3, 1, None, 'Segurar 40 segundos por série.'),
			('Caminhada na esteira', 1, 20, None, 'Inclinação 6%, 20 minutos.'),
		]),
	],
	'Gabriel Sampaio Rocha': [
		('Treino A — Peito e tríceps', 'Hipertrofia, progressão de carga a cada duas semanas.', [
			('Supino reto com halteres', 4, 10, '24.00', ''),
			('Crucifixo na máquina', 3, 12, '35.00', ''),
			('Tríceps na polia', 4, 12, '25.00', ''),
		]),
		('Treino B — Costas e bíceps', 'Hipertrofia.', [
			('Puxada frontal', 4, 10, '55.00', ''),
			('Remada baixa', 4, 10, '50.00', ''),
			('Rosca direta', 4, 10, '20.00', ''),
		]),
		('Treino C — Pernas e ombros', 'Hipertrofia.', [
			('Agachamento livre', 4, 10, '60.00', ''),
			('Leg press 45°', 4, 12, '140.00', ''),
			('Desenvolvimento com halteres', 4, 10, '16.00', ''),
			('Elevação lateral', 3, 15, '6.00', ''),
		]),
	],
	'Renata Albuquerque': [
		('Treino em casa — Full body', 'Atendimento em domicílio: halteres leves e peso corporal.', [
			('Agachamento livre', 3, 15, None, 'Peso corporal; apoio na cadeira se precisar.'),
			('Ponte de glúteos', 3, 15, None, ''),
			('Desenvolvimento com halteres', 3, 12, '4.00', ''),
			('Prancha abdominal', 3, 1, None, 'Segurar 30 segundos.'),
		]),
	],
	'Sandra Queiroz': [
		('Treino adaptado — Equilíbrio (60+)', 'Atendimento na academia do condomínio. Sempre com apoio por perto.', [
			('Caminhada na esteira', 1, 12, None, 'Sem inclinação, 12 minutos.'),
			('Leg press 45°', 2, 12, '25.00', 'Amplitude confortável.'),
			('Elevação lateral', 2, 12, '1.00', ''),
		]),
	],
	'Treino próprio (instrutor)': [
		('Treino A — Força', 'Meu treino: progressão semanal de carga.', [
			('Agachamento livre', 5, 5, '100.00', ''),
			('Supino reto com halteres', 4, 8, '32.00', ''),
			('Remada baixa', 4, 8, '70.00', ''),
		]),
	],
	'Rafael Nunes (amigo)': [
		('Treino iniciante', 'Treino de um amigo, duas vezes por semana.', [
			('Leg press 45°', 3, 12, '60.00', ''),
			('Puxada frontal', 3, 12, '35.00', ''),
			('Prancha abdominal', 3, 1, None, 'Segurar 30 segundos.'),
		]),
	],
	'Lucas Ferraz Andrade': [
		('Treino iniciante — Adaptado (adolescente)', 'Foco em técnica e postura; cargas leves.', [
			('Agachamento livre', 3, 12, None, 'Peso corporal; corrigir a postura.'),
			('Supino reto com halteres', 3, 12, '6.00', ''),
			('Puxada frontal', 3, 12, '20.00', ''),
			('Prancha abdominal', 3, 1, None, 'Segurar 30 segundos.'),
		]),
	],
}

# Evolução das medidas: nome -> (nº de avaliações, dias entre avaliações, valores iniciais, valores finais)
MEDIDAS = {
	'Beatriz Nogueira Costa': (6, 35,
		dict(peso=74.0, altura=1.65, braco=29.0, abdomen=86.0, torax=94.0, cintura=84.0, quadril=104.0, perna=60.0, suprailiaca=24.0, subescapular=18.0, panturrilha=37.0, triceps=22.0),
		dict(peso=70.8, altura=1.65, braco=28.0, abdomen=80.5, torax=92.0, cintura=77.5, quadril=100.5, perna=58.0, suprailiaca=19.5, subescapular=15.0, panturrilha=36.5, triceps=18.5)),
	'Marcos Vinícius Teles': (6, 35,
		dict(peso=96.0, altura=1.78, braco=34.0, abdomen=106.0, torax=108.0, cintura=102.0, quadril=107.0, perna=63.0, suprailiaca=30.0, subescapular=26.0, panturrilha=40.0, triceps=20.0),
		dict(peso=90.4, altura=1.78, braco=34.5, abdomen=97.0, torax=106.0, cintura=94.0, quadril=104.0, perna=62.0, suprailiaca=24.0, subescapular=21.0, panturrilha=40.0, triceps=17.5)),
	'Helena Duarte Campos': (4, 45,
		dict(peso=68.0, altura=1.58, braco=28.0, abdomen=92.0, torax=95.0, cintura=88.0, quadril=100.0, perna=54.0, suprailiaca=25.0, subescapular=20.0, panturrilha=34.0, triceps=24.0),
		dict(peso=66.6, altura=1.58, braco=28.5, abdomen=90.0, torax=95.0, cintura=85.5, quadril=99.0, perna=55.0, suprailiaca=23.0, subescapular=19.0, panturrilha=35.0, triceps=23.0)),
	'Gabriel Sampaio Rocha': (3, 21,
		dict(peso=66.0, altura=1.76, braco=31.0, abdomen=76.0, torax=92.0, cintura=74.0, quadril=92.0, perna=52.0, suprailiaca=10.0, subescapular=11.0, panturrilha=35.0, triceps=9.0),
		dict(peso=68.4, altura=1.76, braco=33.0, abdomen=77.0, torax=95.5, cintura=75.0, quadril=93.0, perna=54.0, suprailiaca=10.5, subescapular=11.5, panturrilha=36.0, triceps=9.5)),
	'Renata Albuquerque': (3, 30,
		dict(peso=71.0, altura=1.62, braco=29.0, abdomen=88.0, torax=93.0, cintura=82.0, quadril=101.0, perna=57.0, suprailiaca=22.0, subescapular=17.0, panturrilha=36.0, triceps=21.0),
		dict(peso=69.6, altura=1.62, braco=28.5, abdomen=85.0, torax=92.0, cintura=79.5, quadril=99.5, perna=56.5, suprailiaca=20.0, subescapular=16.0, panturrilha=36.0, triceps=19.5)),
	'Juliana Moraes Pinto': (4, 30,
		dict(peso=63.5, altura=1.68, braco=27.0, abdomen=74.0, torax=88.0, cintura=70.0, quadril=96.0, perna=56.0, suprailiaca=18.0, subescapular=14.0, panturrilha=35.0, triceps=19.0),
		dict(peso=61.8, altura=1.68, braco=27.0, abdomen=72.0, torax=88.0, cintura=68.0, quadril=95.0, perna=55.5, suprailiaca=16.0, subescapular=13.0, panturrilha=35.0, triceps=17.0)),
}

# Despesas fixas por mês (descrição, categoria, dia, valores dos 6 meses do mais antigo ao atual; None = não há)
DESPESAS = [
	('Aluguel do studio', 'aluguel', 5, ['900.00'] * 6),
	('Conta de energia', 'energia_agua', 12, ['248.00', '262.00', '271.00', '255.00', '268.00', '274.00']),
	('Conta de água', 'energia_agua', 12, ['64.00', '66.00', '71.00', '68.00', '70.00', '72.00']),
	('Salário da recepção', 'salarios', 7, ['700.00'] * 6),
	('Impulsionamento no Instagram', 'marketing', 2, ['100.00', '120.00', '120.00', '150.00', '150.00', '150.00']),
	('Material de limpeza', 'outros', 3, ['78.00', '82.00', '75.00', '90.00', '84.00', '88.00']),
	('Manutenção de esteira', 'manutencao', 22, [None, '180.00', None, None, '320.00', None]),
	('Compra de halteres e anilhas', 'equipamentos', 9, [None, None, '640.00', None, None, None]),
]
DESPESAS_PERSONAL = [
	('Transporte para atendimentos', 'outros', 6, [None, None, '110.00', '125.00', '118.00', '130.00']),
	('Elásticos e acessórios', 'equipamentos', 15, [None, None, None, '180.00', None, None]),
]
DESPESAS_POR_PERFIL = {'academia': DESPESAS, 'personal': DESPESAS_PERSONAL}
DESCRICOES_DESPESAS = [linha[0] for linhas in DESPESAS_POR_PERFIL.values() for linha in linhas]


def _agora_em(dia, hora, minuto=0):
	return timezone.make_aware(datetime.combine(dia, time(hora, minuto)))


class Command(BaseCommand):
	help = 'Cria (ou, com --limpar, remove) dados fictícios de demonstração.'

	def add_arguments(self, parser):
		parser.add_argument('--limpar', action='store_true', help='Só remove os dados de demonstração.')

	@transaction.atomic
	def handle(self, *args, **options):
		removidos = self._remover()
		self.stdout.write(f'Dados de demonstração anteriores removidos: {removidos}')
		if options['limpar']:
			return

		self.hoje = timezone.localdate()
		self.agora = timezone.now()
		self.mes_atual = self.hoje.replace(day=1)
		self.rng = random.Random(2026)
		self.perfis = {}
		for tipo, nome in Perfil.TIPO_CHOICES:
			self.perfis[tipo], _ = Perfil.objects.get_or_create(tipo=tipo, defaults={'nome': nome})

		alunos = self._criar_alunos()
		exercicios = self._criar_exercicios()
		treinos = self._criar_treinos(alunos, exercicios)
		medidas = self._criar_medidas(alunos)
		mensalidades = self._criar_mensalidades(alunos)
		despesas = self._criar_despesas()

		self.stdout.write(self.style.SUCCESS(
			f'Pronto: {len(alunos)} alunos, {medidas} avaliações, {treinos} treinos, '
			f'{mensalidades} mensalidades, {despesas} despesas.'))

	# ---------- limpeza ----------
	def _remover(self):
		mensalidades = Mensalidade.objects.filter(aluno_nome__in=NOMES_DEMO).delete()[0]
		alunos = Aluno.objects.filter(nome__in=NOMES_DEMO).delete()[0]  # leva medidas e treinos junto
		despesas = Despesa.objects.filter(descricao__in=DESCRICOES_DESPESAS).delete()[0]
		return mensalidades + alunos + despesas

	# ---------- alunos e catálogo ----------
	def _criar_alunos(self):
		alunos = {}
		for indice, (nome, turno, nascimento, valor, dia, inicio, fim, ativo) in enumerate(ALUNOS, start=1):
			alunos[nome] = Aluno.objects.create(
				perfil=self.perfis[PERFIL_DO_ALUNO.get(nome, 'academia')],
				nome=nome,
				contato=f'(34) 90000-{indice:04d}',
				data_nascimento=nascimento,
				turno=turno,
				valor_mensalidade=Decimal(valor) if valor else None,
				dia_vencimento=dia,
				ativo=ativo,
			)
		return alunos

	def _criar_exercicios(self):
		"""Cada perfil tem o próprio catálogo (specs/perfis.md); não duplica o que já existe."""
		exercicios = {}
		for tipo, perfil in self.perfis.items():
			for nome, grupo, descricao in EXERCICIOS:
				exercicio = Exercicio.objects.filter(nome=nome, perfil=perfil).first()
				if exercicio is None:
					exercicio = Exercicio.objects.create(nome=nome, grupo_muscular=grupo, descricao=descricao, perfil=perfil)
				exercicios[(tipo, nome)] = exercicio
		return exercicios

	# ---------- treinos ----------
	def _criar_treinos(self, alunos, exercicios):
		total = 0
		for nome_aluno, lista in TREINOS.items():
			tipo = PERFIL_DO_ALUNO.get(nome_aluno, 'academia')
			for nome_treino, observacoes, itens in lista:
				treino = Treino.objects.create(aluno=alunos[nome_aluno], nome=nome_treino, observacoes=observacoes)
				for exercicio, series, repeticoes, carga, adaptacao in itens:
					ItemTreino.objects.create(
						treino=treino, exercicio=exercicios[(tipo, exercicio)], series=series,
						repeticoes=repeticoes, carga=Decimal(carga) if carga else None, adaptacao=adaptacao)
				total += 1
		return total

	# ---------- medidas ----------
	def _criar_medidas(self, alunos):
		total = 0
		for nome, (quantidade, intervalo, inicial, final) in MEDIDAS.items():
			ultima = self.hoje - timedelta(days=9)  # a avaliação mais recente foi há pouco
			for numero in range(quantidade):
				fracao = numero / (quantidade - 1)
				data = ultima - timedelta(days=intervalo * (quantidade - 1 - numero))
				valores = {}
				for campo, valor_inicial in inicial.items():
					valor = valor_inicial + (final[campo] - valor_inicial) * fracao
					if campo != 'altura' and 0 < numero < quantidade - 1:
						valor += self.rng.uniform(-0.25, 0.25)  # pequena oscilação natural
					casas = 2 if campo == 'altura' else 1
					valores[campo] = Decimal(str(round(valor, casas)))
				Medida.objects.create(aluno=alunos[nome], data_avaliacao=data, **valores)
				total += 1
		return total

	# ---------- financeiro ----------
	def _criar_mensalidades(self, alunos):
		total = 0
		for nome, _turno, _nasc, valor, dia, inicio, fim, _ativo in ALUNOS:
			if not valor:
				continue
			ultimo = 0 if fim is None else fim
			for deslocamento in range(inicio, ultimo + 1):
				competencia = somar_meses(self.mes_atual, deslocamento)
				vencimento = competencia.replace(day=dia)
				pago_em = self._quando_pagou(nome, deslocamento, vencimento)
				Mensalidade.objects.create(
					aluno=alunos[nome], aluno_nome=nome, competencia=competencia, valor=Decimal(valor),
					data_vencimento=vencimento, data_pagamento=pago_em)
				total += 1
		return total

	def _quando_pagou(self, nome, deslocamento, vencimento):
		"""Devolve o instante do pagamento, ou None se a mensalidade fica em aberto."""
		if deslocamento == -1 and nome in EM_ABERTO_MES_ANTERIOR:
			return None
		if deslocamento == 0:
			if vencimento <= self.hoje:
				if nome in ATRASADO_NO_MES_ATUAL:
					return None
				dia_pagamento = min(vencimento + timedelta(days=self.rng.randint(0, 2)), self.hoje)
			elif nome in PAGOU_ADIANTADO:
				dia_pagamento = self.hoje - timedelta(days=self.rng.randint(0, 2))
			else:
				return None  # vence nos próximos dias
		else:
			dia_pagamento = vencimento + timedelta(days=self.rng.randint(0, 3))
		pago_em = _agora_em(dia_pagamento, self.rng.randint(8, 20), self.rng.choice([0, 12, 25, 41, 53]))
		return min(pago_em, self.agora)  # nunca no futuro

	def _criar_despesas(self):
		total = 0
		for tipo, despesas in DESPESAS_POR_PERFIL.items():
			for descricao, categoria, dia, valores in despesas:
				for posicao, valor in enumerate(valores):
					if valor is None:
						continue
					data = somar_meses(self.mes_atual, posicao - 5).replace(day=dia)
					if data > self.hoje:
						continue  # nada no futuro
					Despesa.objects.create(descricao=descricao, categoria=categoria, valor=Decimal(valor), data=data, perfil=self.perfis[tipo])
					total += 1
		return total

