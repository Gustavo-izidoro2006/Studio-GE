# Spec — Montagem de treino

## Contexto
O instrutor define quais exercícios um aluno específico vai fazer, com parâmetros próprios e possíveis adaptações.

## Modelo de dados

**Treino**
| Campo | Tipo | Obrigatório |
|---|---|---|
| aluno_id | referência (FK) | sim |
| nome | texto (ex: "Treino A") | sim |
| observacoes | texto | não |

**ItemTreino** (liga Treino + Exercicio)
| Campo | Tipo | Obrigatório |
|---|---|---|
| treino_id | referência (FK) | sim |
| exercicio_id | referência (FK) | sim |
| series | número | não |
| repeticoes | número | não |
| carga | número (kg) | não |
| adaptacao | texto | não |

## Funcionalidade
- Criar treino para um aluno
- Adicionar/remover exercícios do treino (a partir do catálogo)
- Definir séries, repetições, carga e adaptação por exercício dentro do treino

## Critérios de aceite
- [ ] Um treino pertence a um único aluno
- [ ] Um treino pode ter zero ou mais exercícios
- [ ] O campo de adaptação é sempre opcional e específico daquele exercício dentro daquele treino
