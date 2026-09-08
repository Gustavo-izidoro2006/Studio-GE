# Spec — Evolução de medidas do aluno (v3)

## Contexto
Atualiza a v2. Duas mudanças nesta versão, dentro da aba **Evolução**:
1. A **Comparação** deixa de ser um grid fixo (atual x anterior, ou N avaliações soltas) e vira uma **tabela configurável**: o instrutor escolhe quais avaliações e quais métricas entram.
2. O **Gráfico** ganha visual mais limpo e passa a usar um seletor único de métrica (dropdown), mostrando o trajeto completo do aluno (todas as avaliações), não só peso/IMC.

A aba **Histórico** e a aba **Atual** não mudam nesta versão — seguem como definidas na v2.

## Aba "Evolução" — 2 seções

### 1. Gráfico
- Seletor único de métrica, em formato dropdown/bottom sheet — nunca uma fileira de botões (não escala pras 12+ métricas disponíveis)
- Todas as métricas disponíveis no seletor, agrupadas pelas 3 categorias já definidas: Composição corporal, Circunferências, Dobras cutâneas
- Ao escolher uma métrica, o gráfico mostra o **trajeto completo**: todas as avaliações do aluno em ordem cronológica, não uma janela limitada
- Visual mais limpo: linha única, pontos discretos marcados, eixo com datas abreviadas, sem grade visual pesada, leve preenchimento sombreado abaixo da linha (área), cor azul da identidade do app
- Tocar num ponto do gráfico mostra o valor exato e a data daquele ponto
- Continua navegável arrastando horizontalmente quando há muitas avaliações (mantém o comportamento já implementado)

### 2. Comparação — tabela configurável (substitui a versão anterior)
- O instrutor escolhe **quais avaliações** comparar, a partir do Histórico (seleção por checkbox) — sem limite fixo: pode ser 2, 3 ou mais (ex: início, meio e fim de um ciclo de treino)
- O instrutor também escolhe **quais métricas** entram na comparação, como um filtro (ex: só Braço; ou Braço + Perna + Tríceps)
- Resultado: **tabela** com as avaliações escolhidas como colunas (data no topo de cada uma) e as métricas escolhidas como linhas — o instrutor lê na horizontal e vê a progressão de cada métrica ao longo das datas escolhidas
- Sem nenhum filtro de métrica aplicado, a tabela mostra todas as métricas disponíveis por padrão (evita tela vazia) — **ponto a confirmar com você**, se preferir que comece vazia até ele escolher, é só avisar
- Tabela com rolagem horizontal (se muitas avaliações) e vertical (se muitas métricas)

## Aba "Histórico" — sem mudança nesta versão
Mantém o que já foi definido na v2: lista completa e rolável de todas as avaliações, tocar abre o detalhe, e é aqui que fica o modo de seleção (checkbox) que alimenta a Comparação acima.

## Critérios de aceite
- [ ] Trocar a métrica no seletor do gráfico atualiza a curva sem recarregar a tela, sempre mostrando o trajeto completo
- [ ] A tabela de comparação nunca fica travada em "atual vs anterior" — sempre reflete a seleção de avaliações feita no Histórico
- [ ] A tabela funciona bem com 2, 3 ou mais avaliações selecionadas, sem limite artificial de quantidade
- [ ] O filtro de métricas da tabela aceita 1 ou várias métricas ao mesmo tempo
- [ ] A aba Histórico não muda de comportamento nesta versão
