from datetime import date, timedelta
from decimal import Decimal

from django.test import TestCase
from django.utils import timezone

from .models import Aluno, Despesa, Mensalidade


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

		self.client.post(f'/api/mensalidades/{mensalidade.id}/pagar/')
		resumo = self.client.get('/api/financeiro/resumo/').json()
		self.assertEqual(resumo['recebido'], '100.10')
		self.assertEqual(resumo['a_receber'], '0.00')
		self.assertEqual(resumo['saldo'], '70.10')

		self.client.post(f'/api/mensalidades/{mensalidade.id}/desfazer-pagamento/')
		resumo = self.client.get('/api/financeiro/resumo/').json()
		self.assertEqual(resumo['recebido'], '0.00')
		self.assertEqual(resumo['a_receber'], '100.10')

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
