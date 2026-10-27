# Spec — Financeiro: tela

Depende de `specs/financeiro-dados.md` (dados, cálculos e ações). Paleta e estrutura geral seguem `specs/ui-base.md`.

## Contexto
Quinta aba do app. O instrutor abre e responde, de cima para baixo: "Como estou neste mês?", "Estou melhorando ou piorando?", "Quem preciso cobrar?".

## Layout (de cima para baixo)
1. **Seletor de mês:** seta para o mês anterior, nome do mês e ano no centro, seta para o próximo. Não é possível avançar além do mês atual.
2. **Quatro cartões de resumo** (2 por linha): Recebido, Despesas, Saldo, A receber. Cada um com ícone, rótulo e valor em reais.
3. **Barra de progresso do mês:** texto "Previsto no mês: R$ X" e "N% recebido", com barra preenchida proporcional. Logo abaixo, uma linha pequena: "N de M em atraso (P%)".
4. **Gráfico "Receita x despesa":** barras agrupadas dos últimos 6 meses (azul = receita, amarelo = despesa), nome do mês abreviado embaixo, legenda com texto. Tocar numa barra mostra o valor exato.
5. **Lista "Pagamentos em atraso" / pendências:** uma linha por mensalidade com ícone de estado, nome do aluno, texto de situação, valor e botão **Pago**. Contador de atrasados no título.
6. **Despesas:** botão "+ Despesa" (ação à direita do header) e atalho "Ver despesas do mês".

## Comportamentos
- Ao abrir a aba, o mês exibido é o atual.
- Marcar **Pago** atualiza cartões, barra e lista na hora, sem pedir confirmação. Aparece um aviso curto "Marcado como pago · Desfazer" por alguns segundos.
- "+ Despesa" abre formulário: descrição, categoria (seletor), valor, data (padrão: hoje). Salvar volta ao Financeiro com os números atualizados.
- "Ver despesas do mês" abre a lista do mês selecionado (descrição, categoria, data, valor), com total no topo. Tocar numa despesa permite editar ou excluir; excluir pede confirmação.
- Na tela de cadastro/edição de aluno entram três campos: valor da mensalidade (reais), dia de vencimento (1 a 28) e aluno ativo (sim/não).

## Textos e formatos
- Dinheiro no padrão brasileiro: `R$ 4.850,00`.
- Situação na lista: "Atrasado há 9 dias", "Vence hoje", "Vence em 2 dias".
- Saldo negativo aparece com sinal de menos e ícone de seta para baixo (ex.: `−R$ 300,00`).

## Estados especiais
- **Carregando:** indicador de carga no lugar dos números.
- **Sem conexão com o servidor:** mensagem "Não foi possível carregar o financeiro" e botão "Tentar de novo".
- **Mês sem mensalidades:** cartões zerados e, no lugar da lista, o texto "Nenhuma mensalidade neste mês. Informe o valor da mensalidade nos alunos."
- **Ninguém em atraso:** a lista mostra "Tudo em dia" com ícone de confirmação.
- **Gráfico sem dados:** meses sem movimento aparecem com barra vazia, nunca quebram o gráfico.

## Acessibilidade
- Cor nunca é a única informação: atrasado = ícone de alerta + texto; vence em breve = ícone de relógio + texto; indicadores têm ícone e rótulo.
- Todos os botões e linhas tocáveis com pelo menos 44px de altura e largura.
- Contraste de texto sobre os cartões legível (texto escuro sobre fundo claro).
- O gráfico tem um resumo em texto acessível (ex.: "Outubro: receita R$ 4.850, despesa R$ 2.130").

## Fora do escopo
- Editar o valor de uma mensalidade individual.
- Filtros por turno ou por aluno no gráfico.
- Tela de histórico de pagamentos por aluno.

## Critérios de aceite
- [ ] A aba Financeiro aparece como quinta aba, com o mesmo padrão visual das outras (ativa em azul com barra amarela).
- [ ] Os quatro cartões batem com as definições de `specs/financeiro-dados.md`.
- [ ] Trocar de mês atualiza cartões, barra, gráfico e lista; o mês seguinte ao atual não pode ser selecionado.
- [ ] O gráfico mostra 6 meses em ordem cronológica, com legenda e valor ao tocar.
- [ ] Marcar Pago e Desfazer funcionam e os números mudam imediatamente.
- [ ] Cadastrar, editar e excluir despesa funcionam; excluir pede confirmação.
- [ ] Os três novos campos do aluno podem ser salvos e editados; dia de vencimento fora de 1–28 é rejeitado.
- [ ] Nenhum estado de atraso ou saldo depende só de cor.
- [ ] Todos os estados especiais (carregando, erro, sem dados, tudo em dia) aparecem corretamente.
