from django.contrib import admin

from .models import Aluno, Despesa, Exercicio, ItemTreino, Medida, Mensalidade, Perfil, Treino


@admin.register(Mensalidade)
class MensalidadeAdmin(admin.ModelAdmin):
	list_display = ['aluno_nome', 'perfil', 'competencia', 'valor', 'data_vencimento', 'data_pagamento', 'status', 'dias_atraso']
	list_filter = ['perfil', 'competencia']
	readonly_fields = ['status', 'dias_atraso']


@admin.register(Despesa)
class DespesaAdmin(admin.ModelAdmin):
	list_display = ['descricao', 'perfil', 'categoria', 'valor', 'data']
	list_filter = ['perfil', 'categoria']


@admin.register(Perfil)
class PerfilAdmin(admin.ModelAdmin):
	list_display = ['nome', 'tipo']


admin.site.register([Aluno, Medida, Exercicio, Treino, ItemTreino])
