from datetime import date, timedelta
from decimal import Decimal

from django.test import TestCase
from django.utils import timezone

from .models import Aluno, Despesa, Exercicio, ItemTreino, Mensalidade, Treino


def mes_atual():
	return timezone.localdate().replace(day=1)


class FinanceiroAPITests(TestCase):
	def setUp(self):
		self.aluno = Aluno.objects.create(nome='Ana', valor_mensalidade=Decimal('100.10'), dia_vencimento=10)

	def test_geracao_nao_duplica(self):
		self.client.post('/api/financeiro/gerar-mensalidades/')
		resposta = self.client.post('/api/financeiro/gerar-mensalidades/')
		self.assertEqual(resposta.json()['criadas'], 0)
		self.assertEqual(Mensalidade.objects.count(), 1)

	def test_geracao_ignora_inativo_e_sem_valor(self):
		Aluno.objects.create(nome='Inativo', valor_mensalidade=Decimal('50'), dia_vencimento=5, ativo=False)
		Aluno.objects.create(nome='Cortesia')
		self.client.post('/api/financeiro/gerar-mensalidades/')
		self.assertEqual(Mensalidade.objects.count(), 1)

	def test_mudar_valor_do_aluno_nao_altera_mensalidade(self):
		self.client.post('/api/financeiro/gerar-mensalidades/')
		self.aluno.valor_mensalidade = Decimal('200')
		self.aluno.save()
		self.assertEqual(Mensalidade.objects.get().valor, Decimal('100.10'))

	def test_excluir_aluno_mantem_mensalidade(self):
		self.client.post('/api/financeiro/gerar-mensalidades/')
		self.aluno.delete()
		mensalidade = Mensalidade.objects.get()
		self.assertIsNone(mensalidade.aluno)
		self.assertEqual(mensalidade.aluno_nome, 'Ana')

	def test_pagar_e_desfazer_alteram_resumo(self):
		self.client.post('/api/financeiro/gerar-mensalidades/')
		Despesa.objects.create(descricao='Luz', categoria='energia_agua', valor=Decimal('30.00'), data=mes_atual())
		mensalidade = Mensalidade.objects.get()

		pagamento = self.client.post(f'/api/mensalidades/{mensalidade.id}/pagar/').json()
		self.assertIsNotNone(pagamento['data_pagamento'])
		resumo = self.client.get('/api/financeiro/resumo/').json()
		self.assertEqual(resumo['recebido'], '100.10')
		self.assertEqual(resumo['a_receber'], '0.00')
		self.assertEqual(resumo['saldo'], '70.10')

		self.client.post(f'/api/mensalidades/{mensalidade.id}/desfazer-pagamento/')
		resumo = self.client.get('/api/financeiro/resumo/').json()
		self.assertEqual(resumo['recebido'], '0.00')
		self.assertEqual(resumo['a_receber'], '100.10')

	def test_historico_lista_pagamentos_mais_recentes_primeiro(self):
		outro = Aluno.objects.create(nome='Bia')
		mais_antiga = Mensalidade.objects.create(
			aluno=self.aluno, aluno_nome='Ana', competencia=mes_atual(),
			valor=Decimal('100.10'), data_vencimento=mes_atual().replace(day=10),
			data_pagamento=timezone.now() - timedelta(days=1),
		)
		mais_recente = Mensalidade.objects.create(
			aluno=outro, aluno_nome='Bia', competencia=mes_atual(),
			valor=Decimal('150.00'), data_vencimento=mes_atual().replace(day=10),
			data_pagamento=timezone.now(),
		)
		Mensalidade.objects.create(
			aluno=None, aluno_nome='Caio', competencia=mes_atual(),
			valor=Decimal('75.00'), data_vencimento=mes_atual().replace(day=10),
		)

		resposta = self.client.get('/api/mensalidades/?pagas=true')

		self.assertEqual(resposta.status_code, 200)
		self.assertEqual([item['id'] for item in resposta.json()], [mais_recente.id, mais_antiga.id])
		self.assertIn('T', resposta.json()[0]['data_pagamento'])

	def test_mes_vazio_devolve_zeros(self):
		resumo = self.client.get('/api/financeiro/resumo/?mes=2020-01').json()
		for campo in ('previsto', 'recebido', 'a_receber', 'despesas', 'saldo', 'percentual_recebido', 'taxa_inadimplencia'):
			self.assertEqual(Decimal(resumo[campo]), 0)
		self.assertEqual(resumo['em_atraso'], 0)
		self.assertEqual(len(resumo['serie']), 6)
		self.assertEqual(resumo['pendencias'], [])

	def test_mes_invalido_da_400(self):
		self.assertEqual(self.client.get('/api/financeiro/resumo/?mes=abc').status_code, 400)

	def test_serie_tem_seis_meses_em_ordem(self):
		serie = self.client.get('/api/financeiro/resumo/?mes=2026-02').json()['serie']
		self.assertEqual([s['mes'] for s in serie], ['2025-09', '2025-10', '2025-11', '2025-12', '2026-01', '2026-02'])

	def test_atrasada_de_mes_anterior_aparece_nas_pendencias(self):
		antigo = mes_atual() - timedelta(days=40)
		competencia = antigo.replace(day=1)
		Mensalidade.objects.create(
			aluno=self.aluno, aluno_nome='Ana', competencia=competencia,
			valor=Decimal('100.10'), data_vencimento=competencia.replace(day=10),
		)
		pendencias = self.client.get('/api/financeiro/resumo/').json()['pendencias']
		self.assertEqual(len(pendencias), 1)
		self.assertEqual(pendencias[0]['status'], 'atrasado')

	def test_ordem_das_pendencias(self):
		hoje = timezone.localdate()
		outro = Aluno.objects.create(nome='Bia')
		futuro = Mensalidade.objects.create(
			aluno=self.aluno, aluno_nome='Ana', competencia=mes_atual(),
			valor=Decimal('10'), data_vencimento=hoje + timedelta(days=3),
		)
		atrasada = Mensalidade.objects.create(
			aluno=outro, aluno_nome='Bia', competencia=mes_atual(),
			valor=Decimal('10'), data_vencimento=hoje - timedelta(days=2),
		)
		ids = [p['id'] for p in self.client.get('/api/financeiro/resumo/').json()['pendencias']]
		self.assertEqual(ids, [atrasada.id, futuro.id])

	def test_vence_hoje_e_pendente(self):
		mensalidade = Mensalidade(
			aluno=self.aluno, aluno_nome='Ana', competencia=mes_atual(),
			valor=Decimal('10'), data_vencimento=timezone.localdate(),
		)
		self.assertEqual(mensalidade.status, 'pendente')

	def test_despesa_crud_e_valor_invalido(self):
		corpo = {'descricao': 'Aluguel', 'categoria': 'aluguel', 'valor': '500.00', 'data': '2026-10-05'}
		criada = self.client.post('/api/despesas/', corpo, content_type='application/json')
		self.assertEqual(criada.status_code, 201)

		for valor in ('0', '-5'):
			resposta = self.client.post('/api/despesas/', {**corpo, 'valor': valor}, content_type='application/json')
			self.assertEqual(resposta.status_code, 400)

		id_ = criada.json()['id']
		editada = self.client.patch(f'/api/despesas/{id_}/', {'valor': '550.00'}, content_type='application/json')
		self.assertEqual(editada.json()['valor'], '550.00')
		self.assertEqual(self.client.delete(f'/api/despesas/{id_}/').status_code, 204)

	def test_despesas_filtradas_por_mes(self):
		Despesa.objects.create(descricao='A', categoria='outros', valor=Decimal('1'), data=date(2026, 9, 30))
		Despesa.objects.create(descricao='B', categoria='outros', valor=Decimal('1'), data=date(2026, 10, 1))
		lista = self.client.get('/api/despesas/?mes=2026-10').json()
		self.assertEqual([d['descricao'] for d in lista], ['B'])


class TreinoAPITests(TestCase):
	def test_editar_treino_atualiza_dados_e_exercicios(self):
		aluno = Aluno.objects.create(nome='Ana')
		outro_aluno = Aluno.objects.create(nome='Bia')
		agachamento = Exercicio.objects.create(nome='Agachamento')
		supino = Exercicio.objects.create(nome='Supino')
		treino = Treino.objects.create(aluno=aluno, nome='Treino A')
		item = ItemTreino.objects.create(treino=treino, exercicio=agachamento, series=3)

		resposta_treino = self.client.patch(
			f'/api/treinos/{treino.id}/',
			{'aluno': outro_aluno.id, 'nome': 'Treino B', 'observacoes': 'Foco em força'},
			content_type='application/json',
		)
		resposta_item = self.client.patch(
			f'/api/itens-treino/{item.id}/',
			{'series': 4, 'repeticoes': 8},
			content_type='application/json',
		)
		resposta_novo_item = self.client.post(
			'/api/itens-treino/',
			{'treino': treino.id, 'exercicio': supino.id, 'adaptacao': ''},
			content_type='application/json',
		)
		self.assertEqual(resposta_treino.status_code, 200)
		self.assertEqual(resposta_item.status_code, 200)
		self.assertEqual(resposta_novo_item.status_code, 201)
		treino.refresh_from_db()
		item.refresh_from_db()
		self.assertEqual((treino.aluno_id, treino.nome, treino.observacoes), (outro_aluno.id, 'Treino B', 'Foco em força'))
		self.assertEqual((item.series, item.repeticoes), (4, 8))

		resposta_remocao = self.client.delete(f'/api/itens-treino/{item.id}/')
		self.assertEqual(resposta_remocao.status_code, 204)
		self.assertEqual(Treino.objects.get(id=treino.id).itens.count(), 1)

	def test_excluir_treino_remove_itens_vinculados(self):
		aluno = Aluno.objects.create(nome='Ana')
		exercicio = Exercicio.objects.create(nome='Agachamento')
		treino = Treino.objects.create(aluno=aluno, nome='Treino A')
		ItemTreino.objects.create(treino=treino, exercicio=exercicio)

		resposta = self.client.delete(f'/api/treinos/{treino.id}/')

		self.assertEqual(resposta.status_code, 204)
		self.assertFalse(Treino.objects.filter(id=treino.id).exists())
		self.assertFalse(ItemTreino.objects.filter(treino=treino).exists())


class PerfisAPITests(TestCase):
	"""specs/perfis.md: cada perfil vê só os próprios dados; sem perfil informado, vale Academia."""

	def setUp(self):
		from .models import Perfil
		self.academia = Perfil.objects.get(tipo='academia')
		self.personal = Perfil.objects.get(tipo='personal')
		self.pessoal = Perfil.objects.get(tipo='pessoal')

	def test_tres_perfis_fixos_e_renomear(self):
		resposta = self.client.get('/api/perfis/')
		self.assertEqual([p['tipo'] for p in resposta.json()], ['academia', 'personal', 'pessoal'])
		resposta = self.client.patch(f'/api/perfis/{self.academia.id}/', {'nome': 'Studio GE'}, content_type='application/json')
		self.assertEqual(resposta.status_code, 200)
		self.assertEqual(resposta.json()['nome'], 'Studio GE')
		self.assertEqual(self.client.patch(f'/api/perfis/{self.academia.id}/', {'nome': '  '}, content_type='application/json').status_code, 400)
		self.assertEqual(self.client.post('/api/perfis/', {'tipo': 'outro', 'nome': 'X'}, content_type='application/json').status_code, 405)
		self.assertEqual(self.client.delete(f'/api/perfis/{self.pessoal.id}/').status_code, 405)

	def test_total_de_alunos_por_perfil(self):
		Aluno.objects.create(nome='A1', perfil=self.personal)
		Aluno.objects.create(nome='A2', perfil=self.personal)
		totais = {p['tipo']: p['total_alunos'] for p in self.client.get('/api/perfis/').json()}
		self.assertEqual(totais, {'academia': 0, 'personal': 2, 'pessoal': 0})

	def test_sem_perfil_cria_e_lista_na_academia(self):
		criado = self.client.post('/api/alunos/', {'nome': 'Sem perfil', 'turno': 'manha'}, content_type='application/json').json()
		self.assertEqual(criado['perfil'], self.academia.id)
		self.assertEqual([a['nome'] for a in self.client.get('/api/alunos/').json()], ['Sem perfil'])

	def test_listas_separadas_por_perfil(self):
		self.client.post(f'/api/alunos/?perfil={self.personal.id}', {'nome': 'Cliente personal', 'turno': 'tarde'}, content_type='application/json')
		Aluno.objects.create(nome='Aluno academia')
		nomes = lambda perfil: [a['nome'] for a in self.client.get(f'/api/alunos/?perfil={perfil.id}').json()]
		self.assertEqual(nomes(self.personal), ['Cliente personal'])
		self.assertEqual(nomes(self.academia), ['Aluno academia'])
		self.assertEqual(nomes(self.pessoal), [])

	def test_perfil_inexistente_da_400(self):
		self.assertEqual(self.client.get('/api/alunos/?perfil=999').status_code, 400)

	def test_avaliacoes_de_um_aluno_ignoram_o_perfil_ativo(self):
		from .models import Medida
		aluno = Aluno.objects.create(nome='Cliente', perfil=self.personal)
		Medida.objects.create(aluno=aluno, data_avaliacao=timezone.localdate(), peso=Decimal('70'))
		resposta = self.client.get(f'/api/medidas/?aluno={aluno.id}&perfil={self.academia.id}')
		self.assertEqual(len(resposta.json()), 1)
		self.assertEqual(len(self.client.get(f'/api/medidas/?perfil={self.academia.id}').json()), 0)

	def test_detalhe_por_id_funciona_em_qualquer_perfil(self):
		aluno = Aluno.objects.create(nome='Cliente', perfil=self.personal)
		self.assertEqual(self.client.get(f'/api/alunos/{aluno.id}/').status_code, 200)

	def test_exercicios_e_treinos_por_perfil(self):
		Exercicio.objects.create(nome='Agachamento', perfil=self.academia)
		Exercicio.objects.create(nome='Elástico', perfil=self.personal)
		nomes = [e['nome'] for e in self.client.get(f'/api/exercicios/?perfil={self.personal.id}').json()]
		self.assertEqual(nomes, ['Elástico'])
		aluno = Aluno.objects.create(nome='Cliente', perfil=self.personal)
		Treino.objects.create(aluno=aluno, nome='Treino em casa')
		Treino.objects.create(aluno=Aluno.objects.create(nome='Outro'), nome='Treino do studio')
		treinos = [t['nome'] for t in self.client.get(f'/api/treinos/?perfil={self.personal.id}').json()]
		self.assertEqual(treinos, ['Treino em casa'])

	def test_treino_nao_aceita_exercicio_de_outro_perfil(self):
		aluno = Aluno.objects.create(nome='Cliente', perfil=self.personal)
		treino = Treino.objects.create(aluno=aluno, nome='Treino')
		do_studio = Exercicio.objects.create(nome='Leg press', perfil=self.academia)
		proprio = Exercicio.objects.create(nome='Elástico', perfil=self.personal)
		recusado = self.client.post('/api/itens-treino/', {'treino': treino.id, 'exercicio': do_studio.id}, content_type='application/json')
		self.assertEqual(recusado.status_code, 400)
		aceito = self.client.post('/api/itens-treino/', {'treino': treino.id, 'exercicio': proprio.id}, content_type='application/json')
		self.assertEqual(aceito.status_code, 201)

	def test_financeiro_separado_por_perfil(self):
		Aluno.objects.create(nome='Studio', valor_mensalidade=Decimal('100'), dia_vencimento=10)
		Aluno.objects.create(nome='Personal', valor_mensalidade=Decimal('500'), dia_vencimento=10, perfil=self.personal)
		self.client.post(f'/api/financeiro/gerar-mensalidades/?perfil={self.personal.id}')
		self.assertEqual(list(Mensalidade.objects.values_list('aluno_nome', 'perfil')), [('Personal', self.personal.id)])
		self.client.post('/api/financeiro/gerar-mensalidades/')
		self.assertEqual(Mensalidade.objects.filter(perfil=self.academia).count(), 1)
		Despesa.objects.create(descricao='Transporte', categoria='outros', valor=Decimal('40'), data=timezone.localdate(), perfil=self.personal)
		resumo_personal = self.client.get(f'/api/financeiro/resumo/?perfil={self.personal.id}').json()
		resumo_academia = self.client.get(f'/api/financeiro/resumo/?perfil={self.academia.id}').json()
		self.assertEqual((resumo_personal['previsto'], resumo_personal['despesas']), ('500.00', '40.00'))
		self.assertEqual((resumo_academia['previsto'], resumo_academia['despesas']), ('100.00', '0.00'))
		self.assertEqual(len(resumo_personal['pendencias']), 1)

	def test_mensalidade_guarda_perfil_mesmo_sem_aluno(self):
		aluno = Aluno.objects.create(nome='Personal', valor_mensalidade=Decimal('500'), dia_vencimento=10, perfil=self.personal)
		self.client.post(f'/api/financeiro/gerar-mensalidades/?perfil={self.personal.id}')
		aluno.delete()
		historico = self.client.get(f'/api/mensalidades/?perfil={self.personal.id}').json()
		self.assertEqual([m['aluno_nome'] for m in historico], ['Personal'])

	def test_despesa_criada_no_perfil_pedido(self):
		criada = self.client.post(f'/api/despesas/?perfil={self.personal.id}', {'descricao': 'Elásticos', 'categoria': 'equipamentos', 'valor': '80.00', 'data': str(timezone.localdate())}, content_type='application/json').json()
		self.assertEqual(criada['perfil'], self.personal.id)
		self.assertEqual(self.client.get('/api/despesas/').json(), [])
