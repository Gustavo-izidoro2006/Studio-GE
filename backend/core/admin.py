from django.contrib import admin

from .models import Aluno, Despesa, Exercicio, ItemTreino, Medida, Mensalidade, Treino


@admin.register(Mensalidade)
class MensalidadeAdmin(admin.ModelAdmin):
	list_display = ['aluno_nome', 'competencia', 'valor', 'data_vencimento', 'data_pagamento', 'status', 'dias_atraso']
	list_filter = ['competencia']
	readonly_fields = ['status', 'dias_atraso']


@admin.register(Despesa)
class DespesaAdmin(admin.ModelAdmin):
	list_display = ['descricao', 'categoria', 'valor', 'data']
	list_filter = ['categoria']


admin.site.register([Aluno, Medida, Exercicio, Treino, ItemTreino])
