# Spec — Financeiro: dados e regras

## Contexto
O instrutor precisa saber quanto o studio recebeu, quanto gastou, quanto ainda tem a receber e quem está devendo. O app **não processa pagamento**: o instrutor apenas marca manualmente que um aluno pagou.

Esta spec define os dados, os cálculos e a API. A tela está em `specs/financeiro-tela.md`.

## Alterações no Aluno
| Campo | Tipo | Obrigatório | Regra |
|---|---|---|---|
| valor_mensalidade | dinheiro (2 casas) | não | Vazio = aluno não é cobrado (ex.: cortesia) |
| dia_vencimento | número inteiro de 1 a 28 | só se houver valor_mensalidade | Limite de 28 evita meses sem dia 29, 30 ou 31 |
| ativo | sim/não | sim (padrão: sim) | Aluno inativo não gera novas mensalidades; as antigas continuam no histórico |

## Nova entidade: Mensalidade
Uma cobrança mensal de um aluno.

| Campo | Tipo | Obrigatório | Regra |
|---|---|---|---|
| aluno | referência ao Aluno | não* | *Se o aluno for excluído, a mensalidade permanece (histórico financeiro não se perde) |
| aluno_nome | texto | sim | Cópia do nome no momento da cobrança, para o histórico continuar legível |
| competencia | data | sim | Sempre o dia 1 do mês cobrado |
| valor | dinheiro (2 casas) | sim | Copiado do aluno ao gerar. Mudar o valor do aluno depois **não** altera mensalidades já geradas |
| data_vencimento | data | sim | Mês da competência + dia_vencimento do aluno |
| data_pagamento | data | não | Vazio = ainda não pago |

- Só existe **uma mensalidade por aluno por competência**.
- Valores calculados (nunca digitados):
  - **status**: `pago` se há data_pagamento; `atrasado` se não pago e vencimento anterior a hoje; `pendente` nos demais casos (vence hoje ainda é pendente).
  - **dias_atraso**: dias entre o vencimento e hoje, só para status atrasado.

## Nova entidade: Despesa
| Campo | Tipo | Obrigatório | Regra |
|---|---|---|---|
| descricao | texto | sim | |
| categoria | escolha | sim | Aluguel, Energia e água, Salários, Equipamentos, Manutenção, Marketing, Outros |
| valor | dinheiro (2 casas) | sim | Maior que zero |
| data | data | sim | Define em qual mês a despesa conta |

## Geração das mensalidades
- Ao abrir a aba Financeiro, o sistema cria as mensalidades **do mês atual** que ainda não existem, para cada aluno ativo com valor_mensalidade e dia_vencimento preenchidos.
- A geração é segura para repetir: abrir a aba várias vezes nunca duplica cobranças.
- Meses passados e futuros **não** são gerados; apenas consultados.

## Cálculos de um mês (mês M)
| Indicador | Definição |
|---|---|
| previsto | soma do valor das mensalidades com competência M |
| recebido | soma do valor das mensalidades de M que estão pagas |
| a_receber | previsto − recebido |
| despesas | soma das despesas com data dentro de M |
| saldo | recebido − despesas (pode ser negativo) |
| percentual_recebido | recebido ÷ previsto (zero se previsto for zero) |
| em_atraso | quantidade de mensalidades de M com status atrasado |
| taxa_inadimplencia | em_atraso ÷ quantidade de mensalidades de M (zero se não houver mensalidades) |

- **Série mensal:** recebido e despesas de cada um dos 6 meses terminando em M, em ordem cronológica. Mês sem dados vale zero.
- **Pendências:** mensalidades não pagas de M **mais** as atrasadas de meses anteriores. Ordem: atrasadas primeiro (maior atraso no topo), depois as pendentes por vencimento mais próximo.

## Ações
- Marcar mensalidade como paga (data de pagamento = hoje).
- Desfazer pagamento (limpa a data), para corrigir toque errado.
- Cadastrar, editar e excluir despesas.
- Consultar o resumo de qualquer mês (indicadores, série e pendências).

## Fora do escopo
- Processar pagamento real (Pix, cartão, boleto) ou guardar dados bancários.
- Planos/pacotes de aulas, descontos, parcelamento e multa por atraso.
- Despesas recorrentes automáticas.
- Gerar mensalidades de meses passados ou futuros.
- Ver as mensalidades dentro da tela de detalhe do aluno.
- Exportar relatórios.

## Critérios de aceite
- [ ] Nenhum valor em dinheiro usa número decimal impreciso; somas fecham ao centavo.
- [ ] Abrir a aba Financeiro duas vezes seguidas no mesmo mês não duplica mensalidades.
- [ ] Alterar o valor_mensalidade de um aluno não muda mensalidades já geradas.
- [ ] Excluir um aluno mantém suas mensalidades no histórico, com o nome original.
- [ ] Status e dias de atraso mudam sozinhos conforme a data passa, sem edição manual.
- [ ] Marcar como paga reduz a_receber e aumenta recebido e saldo na mesma hora; desfazer reverte.
- [ ] Despesa com valor zero ou negativo não é aceita.
- [ ] Mês sem nenhum dado devolve todos os indicadores zerados, sem erro.
- [ ] Mensalidade atrasada de mês anterior aparece nas pendências do mês atual.
