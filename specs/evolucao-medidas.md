# Spec — Evolução de medidas do aluno

## Contexto
Além de ver a avaliação atual (já implementado, ver `ui-medidas.md`), o instrutor precisa acompanhar como o aluno evoluiu entre avaliações — sem perder o acesso às avaliações antigas.

## Alteração de navegação
A tela de Medidas do aluno passa a ter 2 abas internas (não confundir com o bottom tab bar principal do app):
1. **Atual** — o que já existe hoje (card de IMC + lista de campos da última avaliação)
2. **Evolução** — nova, descrita abaixo

## Aba "Evolução"

**Gráfico**
- Gráfico de linha por métrica (ex: peso, IMC), navegável arrastando para o lado (swipe horizontal) para percorrer as avaliações no tempo
- Uma métrica em destaque por vez — não sobrepor métricas de escalas diferentes (kg, cm, mm) no mesmo gráfico

**Comparação em destaque**
- Acima ou junto do gráfico, mostrar a diferença entre a avaliação **atual** e a **imediatamente anterior** (ex: "Peso: 67,5 kg (-1,2 kg desde a última avaliação)")
- Usar indicação visual de melhora/piora (cor ou seta), conforme a métrica (nem toda métrica "melhorar" significa o mesmo — ex: peso pode ser positivo subir ou descer dependendo do objetivo do aluno; por padrão, mostrar a diferença numérica sem julgar se é "boa" ou "ruim")

**Histórico (pasta de avaliações antigas)**
- Lista separada, acessível dentro da mesma aba "Evolução", com todas as avaliações do aluno (mais recente primeiro)
- Tocar em uma avaliação antiga abre os valores completos daquela data (mesmo layout da aba "Atual", mas com dados daquela avaliação específica)
- Essa lista não substitui a comparação atual x anterior — ela é só pra consulta de qualquer avaliação passada

## Critérios de aceite
- [ ] A comparação em destaque sempre usa as duas avaliações mais recentes, mesmo que existam mais de duas no histórico
- [ ] O gráfico responde ao gesto de arrastar (swipe), sem precisar de botões de próximo/anterior
- [ ] Com só 1 avaliação registrada, a aba "Evolução" mostra uma mensagem simples (nada pra comparar ainda), sem gráfico vazio ou erro
- [ ] O histórico lista todas as avaliações, mesmo com muitas ao longo do tempo (rolagem, não paginação nessa primeira versão)
