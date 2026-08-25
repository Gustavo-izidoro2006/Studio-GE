from django.contrib import admin

from .models import Aluno, Exercicio, ItemTreino, Medida, Treino


admin.site.register([Aluno, Medida, Exercicio, Treino, ItemTreino])
