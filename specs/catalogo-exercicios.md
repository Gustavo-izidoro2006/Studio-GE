# Spec — Catálogo de exercícios

## Contexto
Lista de exercícios disponíveis na academia, cadastrada uma vez e reaproveitada na montagem de treinos.

## Modelo de dados (Exercicio)
| Campo | Tipo | Obrigatório |
|---|---|---|
| nome | texto | sim |
| grupo_muscular | texto | não |
| descricao | texto | não |

## Funcionalidade
- Listar exercícios cadastrados
- Cadastrar novo exercício
- Editar/excluir exercício existente

## Critérios de aceite
- [ ] Não é possível salvar um exercício sem nome
- [ ] Exercício excluído não aparece mais na lista ao montar um treino novo (mas treinos já montados que o usam continuam funcionando)
