from rest_framework.routers import DefaultRouter

from .views import (
	AlunoViewSet,
	ExercicioViewSet,
	ItemTreinoViewSet,
	MedidaViewSet,
	TreinoViewSet,
)


router = DefaultRouter()
router.register('alunos', AlunoViewSet)
router.register('medidas', MedidaViewSet)
router.register('exercicios', ExercicioViewSet)
router.register('treinos', TreinoViewSet)
router.register('itens-treino', ItemTreinoViewSet)

urlpatterns = router.urls
