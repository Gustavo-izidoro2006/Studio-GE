from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
	AlunoViewSet,
	DespesaViewSet,
	ExercicioViewSet,
	ItemTreinoViewSet,
	MedidaViewSet,
	MensalidadeViewSet,
	TreinoViewSet,
	gerar_mensalidades,
	resumo_financeiro,
)


router = DefaultRouter()
router.register('alunos', AlunoViewSet)
router.register('medidas', MedidaViewSet)
router.register('exercicios', ExercicioViewSet)
router.register('treinos', TreinoViewSet)
router.register('itens-treino', ItemTreinoViewSet)
router.register('mensalidades', MensalidadeViewSet)
router.register('despesas', DespesaViewSet)

urlpatterns = [
	path('financeiro/gerar-mensalidades/', gerar_mensalidades),
	path('financeiro/resumo/', resumo_financeiro),
] + router.urls
