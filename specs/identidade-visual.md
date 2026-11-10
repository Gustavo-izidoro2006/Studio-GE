# Spec — Identidade visual "Marca do Studio" (v0.1.2)

Origem: pedido do dono por um visual mais premium e profissional, sem ficar poluído, usando o logo do Studio Geração Energia. Escolhida a direção **A. Marca do Studio** (entre três propostas). Substitui a paleta azul #185FA5 citada em `specs/acabamento-visual-v012.md`; o resto daquela spec continua valendo.

## Paleta (tirada do logo)
Tudo em `mobile/constants/ui.ts` (`COLORS`).

| Papel | Cor | Uso |
|---|---|---|
| Marinho (marca) | #002478 | Cabeçalhos, botões principais, seleções, linha do gráfico, receita no gráfico do Financeiro |
| Marinho escuro | #001A57 | Texto sobre fundos azul-claros |
| Azul-claro | #E3E9F6 | Fundos de seleção, botões secundários, avisos |
| Limão (marca) | #A8DC24 | Só como **preenchimento** com texto marinho: botão flutuante, selo do perfil no topo, ação "+ Despesa", último ponto do gráfico |
| Limão claro / texto | #EEF7D6 / #3D5A0A | Cartões de resumo (peso atual, IMC) e etiquetas "lime" |
| Âmbar | #EF9F27 | Só "atenção": a vencer e despesas no gráfico |
| Fundo | #F4F6FA | Fundo das telas (não é o branco seco) |
| Texto / apoio | #14213D / #5F6B76 | Texto principal / texto secundário |

### Regras de contraste (WCAG AA)
- Limão **nunca** é texto ou ícone sobre branco (contraste 1,6:1). Sobre limão, sempre texto marinho (8,5:1).
- Texto branco sobre marinho (13:1); subtítulos sobre marinho em #C9D4EC.
- Texto de apoio #5F6B76 sobre fundo #F4F6FA passa de 4,5:1.
- Verde, vermelho e âmbar vêm sempre com ícone e texto (a cor não carrega o significado sozinha).

## Logo
Arquivo: `mobile/assets/images/logo-studio-ge.png`; componente `components/brand-logo.tsx` (anel branco redondo, lido como "Studio Geração Energia" pelo leitor de tela).

- **O logo é o mesmo nos três perfis** (Academia, Personal, Pessoal). O perfil muda os dados, não a marca: o dono é o mesmo.
- Cabeçalho marinho de Alunos, Exercícios, Treinos e Financeiro: logo pequeno (36px) à esquerda, título no centro e selo limão do perfil ativo abaixo (tocar no selo abre a aba Perfil).
- Aba Perfil: capa marinha com o logo grande (92px), "Studio Geração Energia" e a frase "Alunos, treinos e financeiro em um só lugar". Ali o logo não se repete no cabeçalho.
- Ícone do app, ícone adaptativo do Android (fundo marinho) e tela de abertura (logo sobre marinho) gerados a partir do mesmo logo.
- A barra do sistema fica com ícones claros (combina com o cabeçalho marinho). O app é só tema claro.

## Superfícies
- Itens das listas (Alunos, Exercícios) viram cartões brancos com sombra suave marinho, raio 12px e 8px entre eles.
- Pílula da aba ativa na barra inferior em limão bem claro (#E8F5C8), ícone e texto em marinho.
- Tela do aluno: cabeçalho marinho com seta branca, igual às abas.

## Ajustes encontrados na revisão de layout
1. **Gráfico de evolução**: com até 6 avaliações, todos os pontos cabem na largura do cartão sem rolagem; com mais, rola e abre no fim. O último ponto (avaliação atual) é destacado em limão com borda marinha. Linhas de grade não passam da borda do cartão.
2. **Detalhes de uma avaliação** mostram "Avaliação de DD/MM/AAAA" e há quanto tempo foi, em vez de repetir o nome do aluno.
3. **Avaliações de um aluno seguem o perfil do aluno**, não o perfil ativo: `GET /api/medidas/?aluno=<id>` devolve todas as avaliações daquele aluno. Antes, um aluno do Personal aberto com a Academia ativa aparecia sem avaliações.
4. **Financeiro**: mês escrito "Novembro de 2026" (antes "Novembro De 2026"). O aviso de atraso conta os pagamentos atrasados da lista, inclusive de meses anteriores. Antes podia mostrar "Nenhum aluno em atraso" com atrasados na tela.
5. **Alunos**: contagem no topo da lista ("24 alunos" ou "3 de 24 alunos" com busca ou filtro); filtros de turno anunciam se estão selecionados.

## Critérios de aceite
- As cores de marca, estado e texto vêm de `COLORS`; só tons neutros de apoio (placeholder, divisórias, sombra) podem ficar escritos na tela.
- Logo visível no cabeçalho das quatro abas de trabalho com qualquer perfil ativo, e na capa da aba Perfil.
- Teste do backend: avaliações de um aluno de outro perfil aparecem com `?aluno=` (`test_avaliacoes_de_um_aluno_ignoram_o_perfil_ativo`).
- `tsc` e lint sem erros; testes do backend passando.
