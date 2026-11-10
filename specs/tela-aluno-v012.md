# Spec — Tela do aluno (Medidas) v0.1.2

Origem: `docs/ajustes-finais-v012.md` (A2 a A5). Complementa `specs/evolucao-medidas.md`, sem mudar a estrutura das abas Atual, Evolução e Histórico.

## A2 — Registrar avaliação
- O "+" sai do cabeçalho; o título "Medidas" continua centralizado.
- Botão flutuante com texto, "Nova avaliação", no canto inferior direito, nas três abas.
- O fim de cada aba tem espaço para o botão nunca cobrir o último item.
- Aluno sem avaliações: no lugar do conteúdo, convite "Nenhuma avaliação ainda" com o botão "Registrar primeira avaliação" (sem o botão flutuante, para não duplicar).
- "Comparar avaliações" e "Escolher avaliações" passam a ser botões contornados (um só botão de destaque por tela).

## A3 — Quando reavaliar
- "Última avaliação: 01/11/2026 (há 9 dias)". Acima de 60 dias, em meses.
- Avatar com as iniciais ao lado do nome do aluno.

## A4 — Evolução
**Cartão de resumo** (o mesmo cartão, enriquecido):
- Valor atual da métrica com unidade e a data da avaliação.
- Variação desde a última avaliação e desde a primeira, com seta (↑, ↓ ou —) e texto; sem cor de "bom/ruim".
- Ritmo médio por mês quando há 3 ou mais avaliações e pelo menos 28 dias entre a primeira e a última.

**Gráfico:**
- Escala vertical ajustada à faixa dos dados, com folga, em valores redondos (sem passos de 2,5).
- Linhas de grade horizontais finas e contínuas; texto dos eixos com no mínimo 11px.
- Valores com unidade e vírgula: kg, m, cm (circunferências), mm (dobras).
- Número só no último ponto, que fica destacado em amarelo.
- Tocar/arrastar mostra balão com data completa, valor com unidade e diferença para a avaliação anterior.
- Datas do eixo lidas do texto AAAA-MM-DD (sem o erro de um dia a menos).
- Até 6 avaliações cabe na largura da tela; com mais, rola e abre mostrando as mais recentes.
- A linha anima ao trocar de métrica (desligado com "remover animações").
- Métrica registrada em menos de duas avaliações: mensagem explicando, no lugar do gráfico.
- Resumo textual do gráfico para leitores de tela.

**Aba Atual e tabela comparativa:** valores com unidade e vírgula ("70,8 kg"), IMC com uma casa decimal.

## A5 — Histórico
- Avaliações de um único ano: lista simples.
- De mais de um ano: pastas por ano (mais recente primeiro); a do ano mais recente começa aberta.
- Cada pasta mostra ano, quantidade de avaliações e quantas estão marcadas; abre/fecha com toque em toda a linha (48px), com ícone de pasta e seta.
- A seleção para comparar funciona entre pastas; o contador "N selecionadas" vira uma etiqueta abaixo do título.

## Critérios de aceite
- [ ] Não há "+" no cabeçalho da tela do aluno; "Nova avaliação" abre o formulário nas três abas.
- [ ] Com peso de 74 para 70,8 kg, a queda é visível no gráfico (escala não começa no zero).
- [ ] Nenhum rótulo do eixo mostra valor arredondado diferente do real (ex.: 72,5 exibido como 73).
- [ ] A data do eixo bate com a data da avaliação.
- [ ] O balão mostra data, valor com unidade e diferença.
- [ ] Pastas aparecem só com avaliações de mais de um ano, e marcar avaliações em pastas diferentes permite compará-las.
- [ ] O `tsc` passa sem erros.
