"""Perfis de trabalho (specs/perfis.md).

Cria os três perfis fixos e coloca todos os dados que já existem no perfil Academia.
"""
import django.db.models.deletion
from django.db import migrations, models

import core.models


def criar_perfis(apps, schema_editor):
	Perfil = apps.get_model('core', 'Perfil')
	for tipo, nome in [('academia', 'Academia'), ('personal', 'Personal'), ('pessoal', 'Pessoal')]:
		Perfil.objects.get_or_create(tipo=tipo, defaults={'nome': nome})


def dados_atuais_para_academia(apps, schema_editor):
	Perfil = apps.get_model('core', 'Perfil')
	academia = Perfil.objects.get(tipo='academia')
	for modelo in ['Aluno', 'Exercicio', 'Despesa', 'Mensalidade']:
		apps.get_model('core', modelo).objects.filter(perfil__isnull=True).update(perfil=academia)


def fk_perfil(related_name, null):
	return models.ForeignKey(
		null=null,
		blank=null,
		default=None if null else core.models.perfil_padrao,
		on_delete=django.db.models.deletion.PROTECT,
		related_name=related_name,
		to='core.perfil',
	)


class Migration(migrations.Migration):

	dependencies = [
		('core', '0004_alter_mensalidade_data_pagamento'),
	]

	operations = [
		migrations.CreateModel(
			name='Perfil',
			fields=[
				('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
				('tipo', models.CharField(choices=[('academia', 'Academia'), ('personal', 'Personal'), ('pessoal', 'Pessoal')], max_length=20, unique=True)),
				('nome', models.CharField(max_length=100)),
			],
			options={'ordering': ['id']},
		),
		migrations.RunPython(criar_perfis, migrations.RunPython.noop),
		# 1) campos opcionais, 2) dados atuais para Academia, 3) campos obrigatórios
		migrations.AddField(model_name='aluno', name='perfil', field=fk_perfil('alunos', True)),
		migrations.AddField(model_name='exercicio', name='perfil', field=fk_perfil('exercicios', True)),
		migrations.AddField(model_name='despesa', name='perfil', field=fk_perfil('despesas', True)),
		migrations.AddField(model_name='mensalidade', name='perfil', field=fk_perfil('mensalidades', True)),
		migrations.RunPython(dados_atuais_para_academia, migrations.RunPython.noop),
		migrations.AlterField(model_name='aluno', name='perfil', field=fk_perfil('alunos', False)),
		migrations.AlterField(model_name='exercicio', name='perfil', field=fk_perfil('exercicios', False)),
		migrations.AlterField(model_name='despesa', name='perfil', field=fk_perfil('despesas', False)),
		migrations.AlterField(model_name='mensalidade', name='perfil', field=fk_perfil('mensalidades', False)),
	]
