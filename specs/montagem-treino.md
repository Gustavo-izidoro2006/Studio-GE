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
- Editar um treino salvo, incluindo aluno, nome, observações e exercícios, séries, repetições, carga e adaptação
- Adicionar/remover exercícios do treino (a partir do catálogo)
- Definir séries, repetições, carga e adaptação por exercício dentro do treino
- Consultar todos os treinos salvos e filtrar a lista pelo nome do aluno
- Excluir um treino salvo após confirmação; os exercícios vinculados são removidos junto com ele
- Atualizar a lista de treinos puxando a tela para baixo

## Critérios de aceite
- [ ] Um treino pertence a um único aluno
- [ ] Um treino salvo pode ser editado e as alterações dos exercícios são preservadas
- [ ] Um treino pode ter zero ou mais exercícios
- [ ] O campo de adaptação é sempre opcional e específico daquele exercício dentro daquele treino
- [ ] A lista permite filtrar os treinos por nome do aluno
- [ ] A exclusão pede confirmação e remove o treino e seus exercícios
- [ ] Puxar a lista para baixo atualiza os dados sem botão de recarga
