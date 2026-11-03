# Spec — Cadastro de alunos

## Contexto
O instrutor precisa manter uma lista de alunos ativos na academia, com dados básicos de identificação.

## Modelo de dados (Aluno)
| Campo | Tipo | Obrigatório |
|---|---|---|
| nome | texto | sim |
| contato | texto | não |
| data_nascimento | data | não |
| turno | escolha (manhã, tarde, noite) | sim |

## Funcionalidade
- Listar todos os alunos cadastrados
- Cadastrar novo aluno
- Editar dados de um aluno existente
- Excluir aluno
- Informar data de nascimento em `DD/MM/AAAA`; a entrada avança automaticamente entre dia, mês e ano, e o app envia para a API como `AAAA-MM-DD`.

## Critérios de aceite
- [ ] Não é possível salvar um aluno sem nome
- [ ] A lista de alunos atualiza imediatamente após cadastro/edição/exclusão
- [ ] Ao tocar em um aluno na lista, abre a tela de detalhe dele
