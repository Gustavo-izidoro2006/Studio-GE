# Spec — Cadastro de alunos

## Contexto
O instrutor precisa manter uma lista de alunos ativos na academia, com dados básicos de identificação.

## Modelo de dados (Aluno)
| Campo | Tipo | Obrigatório |
|---|---|---|
| nome | texto | sim |
| contato | texto | não |
| data_nascimento | data | não |

## Funcionalidade
- Listar todos os alunos cadastrados
- Cadastrar novo aluno
- Editar dados de um aluno existente
- Excluir aluno

## Critérios de aceite
- [ ] Não é possível salvar um aluno sem nome
- [ ] A lista de alunos atualiza imediatamente após cadastro/edição/exclusão
- [ ] Ao tocar em um aluno na lista, abre a tela de detalhe dele
