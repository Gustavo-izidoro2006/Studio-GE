# Requisitos — Módulo Financeiro

Continuação da numeração de requisitos do projeto (RF01–RF12 e RNF01–RNF04 já existentes).

## Requisitos funcionais
| ID | Requisito |
|---|---|
| RF13 | O instrutor registra, para cada aluno, o valor da mensalidade e o dia de vencimento |
| RF14 | O instrutor marca um aluno como ativo ou inativo; inativos deixam de ser cobrados |
| RF15 | O sistema gera automaticamente as mensalidades do mês atual para os alunos ativos |
| RF16 | O instrutor marca uma mensalidade como paga e pode desfazer a marcação |
| RF17 | O sistema calcula sozinho o status da mensalidade (pago, pendente, atrasado) e os dias de atraso |
| RF18 | O instrutor lança, edita e exclui despesas, classificadas por categoria |
| RF19 | O sistema mostra, por mês, o total recebido, as despesas, o saldo e o valor a receber |
| RF20 | O sistema mostra o percentual já recebido do mês e a taxa de inadimplência |
| RF21 | O sistema exibe gráfico comparando receita e despesa dos últimos 6 meses |
| RF22 | O sistema lista os pagamentos em atraso e a vencer, com o atrasado mais antigo primeiro |
| RF23 | O instrutor navega entre meses e consulta o histórico financeiro de cada um |

## Requisitos não funcionais
| ID | Requisito |
|---|---|
| RNF05 | Valores em dinheiro têm precisão decimal; somas fecham ao centavo |
| RNF06 | Informações financeiras nunca dependem só de cor; áreas de toque têm no mínimo 44px |
| RNF07 | O app não processa pagamentos nem armazena dados bancários ou de cartão |
| RNF08 | O histórico financeiro é preservado mesmo que alunos sejam excluídos ou mudem de valor |

## Rastreabilidade
- RF13–RF17, RF19–RF20, RF22–RF23: `specs/financeiro-dados.md` e `specs/financeiro-tela.md`
- RF18, RF21: `specs/financeiro-dados.md` e `specs/financeiro-tela.md`
- RNF05–RNF08: `specs/financeiro-dados.md`
