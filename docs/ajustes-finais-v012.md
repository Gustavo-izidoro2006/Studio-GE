# Ajustes finais v0.1.2 — lista de trabalho

Lista acumulada, aba por aba, dos ajustes combinados para a versão 0.1.2. **Não é spec**: no final, os itens viram specs em `specs/` e são implementados por partes.

Princípio geral: **mudar pouco e com propósito**. Manter as telas como estão e ajustar só o que melhora o uso, a leitura dos dados e a decisão do instrutor.

---

## Aba Alunos e tela do aluno (Medidas)

### A1. Cabeçalho da aba Alunos
- Remover o ícone de menu (☰) do canto superior esquerdo e o "+" do canto superior direito.
- Motivo: não executam nenhuma ação (são só desenho) e o "+" duplica o botão flutuante de adicionar aluno.
- O título "Alunos" continua centralizado.
- Observação para as outras abas: os mesmos ícones sem ação aparecem em Exercícios, Treinos, Financeiro e Perfil. Decidir quando chegarmos em cada aba.

### A2. Adicionar avaliação na tela do aluno
- Remover o "+" do cabeçalho da tela Medidas.
- Colocar um botão flutuante **com texto**, "Nova avaliação" (ícone + texto), no canto inferior direito, no mesmo padrão do botão de adicionar aluno, visível nas abas Atual, Evolução e Histórico.
- O conteúdo das três abas ganha espaço no fim para o botão nunca cobrir o último item, a tabela comparativa ou as caixas de seleção.
- Aluno sem nenhuma avaliação: no lugar do conteúdo vazio, um convite central "Registrar primeira avaliação" com o mesmo botão.
- Na aba Evolução, o botão "Comparar avaliações" passa a ser contornado (secundário), para não competir com o botão principal "Nova avaliação" (um só botão de destaque por tela).

### A3. Aba Atual — quando reavaliar
- Ao lado da data da última avaliação, mostrar há quanto tempo foi feita: "Última avaliação: 01/11/2026 (há 9 dias)".
- Motivo: ajuda o instrutor a saber quando é hora de reavaliar.

### A4. Aba Evolução — gráfico mais legível (ajustes, não redesenho)
Manter a estrutura atual (seletor de métrica, cartão de diferença, gráfico, tabela comparativa). Ajustar:
1. **Escala vertical ajustada à faixa dos dados**, com folga acima e abaixo, em vez de começar no zero. Hoje, de 74 para 70,8 kg, a linha fica quase reta e a evolução não aparece.
2. **Linhas de grade horizontais** finas, contínuas e claras, com valores redondos no eixo.
3. **Valores com unidade e vírgula**: kg (peso), m (altura), cm (circunferências), mm (dobras). Ex.: `70,8 kg`. Uma casa decimal (duas para altura).
4. **Número só no último ponto** (o valor atual), em vez de número em todos os pontos. Os demais valores aparecem ao tocar e continuam na tabela comparativa.
5. **Último ponto destacado** (amarelo da paleta, um pouco maior); pontos com pelo menos 8px.
6. **Toque em um ponto**: balão com data completa (DD/MM/AAAA), valor com unidade e diferença para a avaliação anterior (ex.: `70,8 kg (−0,4)`).
7. **Datas do eixo corrigidas**: hoje o rótulo mostra um dia a menos (lê a data como horário de Londres). Formatar direto do texto AAAA-MM-DD.
8. Até 6 avaliações: o gráfico cabe na largura da tela, sem rolagem. Mais que isso: mantém a rolagem lateral atual.
9. Texto dos eixos com no mínimo 11px.
10. Ao trocar de métrica, transição curta da linha (animação leve, sem atrasar o uso).

**Cartão de diferença (o que já existe, enriquecido, sem novos cartões):**
- Valor atual em destaque.
- Diferença desde a última avaliação e desde a primeira, cada uma com seta (↑/↓) e texto. Sem cor de "bom/ruim", porque subir ou descer depende do objetivo do aluno.
- Ritmo médio: ex. `−3,2 kg em 5 meses · cerca de −0,6 kg por mês`.

### A5. Aba Histórico — pastas por ano (só quando ajudam)
- **Avaliações de um único ano:** lista como hoje, sem pastas (sem clique a mais).
- **Avaliações de mais de um ano:** agrupar em pastas por ano, da mais recente para a mais antiga. A pasta do ano mais recente começa aberta e as outras fechadas.
- Cada pasta mostra o ano, quantas avaliações tem e quantas estão marcadas (ex.: `2025 · 6 avaliações · 1 marcada`).
- Abrir/fechar a pasta com toque em toda a linha (área mínima de 44px); ícone de pasta aberta/fechada e seta, não só cor.
- A seleção para comparação continua funcionando entre pastas (dá para comparar 2024 com 2026) e o contador "N selecionadas" no topo continua.

### Fora do escopo desta aba
- Mudar cores, tipografia ou a estrutura das três abas internas.
- Novas métricas ou novos tipos de gráfico.
- Mudanças no backend.

---

## Aba Exercícios

### E1. Cabeçalho
- Remover o ícone de menu (☰) e o "+" do cabeçalho (não executam nenhuma ação; o botão flutuante de adicionar já existe).
- **Nada mais muda nesta aba.**

---

## Aba Treinos

### T1. Cabeçalho
- Remover o ícone de menu (☰) e o "+" do cabeçalho (não executam nenhuma ação).

### T2. Botão "Novo treino" sempre à mão
- Hoje o botão fica depois da lista de treinos: com muitos treinos, é preciso rolar até o fim.
- Trocar por um **botão flutuante redondo com "+"**, fixo no canto inferior direito, igual ao da aba Alunos, visível enquanto a lista rola.
- A lista ganha espaço no fim para o botão não cobrir o último cartão.
- Sem nenhum treino cadastrado: convite central "Monte o primeiro treino", além do botão.

### T3. Editar sem pular para o fim da tela
- Hoje, tocar no lápis abre o formulário no fim da tela e rola até lá.
- Passar a abrir o formulário **por cima da lista, no lugar onde o instrutor está**, num painel deslizante (o mesmo padrão do cadastro de aluno), com título "Editar treino".
- "Novo treino" usa o mesmo painel, com título "Novo treino".
- Dentro do painel continua tudo o que existe hoje: aluno, nome, observações, adicionar/remover exercícios, séries, repetições, carga, adaptação, salvar.
- Ao salvar ou cancelar, o painel fecha e a lista continua na mesma posição, já atualizada.

### T4. Ver o treino em letra maior (sem editar)
- **Tocar no cartão do treino** (em qualquer parte, fora do lápis e da lixeira) abre uma visualização **somente leitura**, em painel deslizante, com texto maior:
  - nome do treino em destaque e nome do aluno;
  - observações do treino (se houver);
  - um exercício por linha: nome (texto 16px), e logo abaixo "3 × 12 · 40 kg" (séries × repetições · carga, só o que estiver preenchido);
  - a adaptação, quando houver, em linha própria e destacada (ex.: fundo amarelo claro com ícone), para não passar despercebida.
- No painel: botão "Editar" (contornado) que abre o formulário do T3, e botão de fechar.
- No cartão da lista (ajuste mínimo): mostrar a quantidade de exercícios ("5 exercícios") e subir o texto dos exercícios de 13px para 14px, com cor mais escura para leitura confortável.
- Lápis e lixeira continuam no cartão como hoje, com área de toque de 44px.

### O que não muda
- O filtro por aluno (está bom).
- Excluir treino com confirmação, puxar para atualizar.

---

## Aba Financeiro

- **Sem mudanças nesta versão** (está boa, incluindo a área de despesas).
- Pendente de decidir na revisão geral: o ícone de menu (☰) do cabeçalho também não executa nenhuma ação.

---

## Aba Perfil — perfis de trabalho (funcionalidade nova)

> Não é ajuste visual: muda a base de dados e todas as telas. Ver "Impacto" abaixo antes de decidir quando entra.

### Ideia (como o usuário descreveu)
O instrutor trabalha em contextos diferentes e não quer misturar os dados:
- **Academia**: os alunos e o financeiro do próprio studio.
- **Personal**: atendimentos em outras academias ou em casa.
- **Pessoal**: o próprio treino e o de amigos.

Cada perfil é uma "pré-definição": ao escolher um perfil, o app mostra só os dados daquele perfil.

### Proposta
- Três perfis fixos, criados automaticamente: Academia, Personal e Pessoal. O nome de cada um pode ser editado (ex.: "Studio Geração Energia").
- A aba Perfil mostra os três perfis como cartões grandes (ícone, nome, nº de alunos) e o perfil ativo marcado; tocar em outro troca o perfil ativo.
- O perfil ativo aparece sempre no topo das telas (ex.: "Academia" abaixo do título), para nunca haver dúvida de onde se está.
- O app lembra o último perfil escolhido ao ser reaberto.
- Separado por perfil: alunos e tudo que é deles (avaliações, treinos, mensalidades) e as despesas.
- Os dados que já existem (inclusive os de demonstração) passam para o perfil Academia.

### Impacto
- Backend: nova entidade Perfil, ligação de Aluno e Despesa ao perfil, migration, filtro por perfil em todas as listas e no resumo financeiro, ajuste do `seed_demo` e testes.
- App: perfil ativo guardado no aparelho (exige uma biblioteca nova de armazenamento local, logo um build novo), filtro em todas as telas, tela Perfil nova, indicação do perfil no topo.
- Tamanho parecido com o do módulo Financeiro inteiro; mexe em todas as abas que estamos ajustando hoje.

### Decisões do usuário (10/11)
1. **Entra nesta versão (0.1.2)**, junto com os ajustes visuais.
2. **Catálogo de exercícios separado por perfil**: cada perfil tem a própria lista de exercícios.
3. **Financeiro separado por perfil**: cada perfil tem suas mensalidades e despesas.

### Consequências das decisões (para a spec)
- Ficam ligados ao perfil: aluno, exercício e despesa. Avaliações, treinos e itens seguem o perfil do aluno.
- A mensalidade guarda o próprio perfil, para o histórico financeiro não se perder se o aluno for excluído (hoje ela já guarda o nome do aluno pelo mesmo motivo).
- Um treino só pode usar exercícios do mesmo perfil do aluno.
- Cada perfil tem seu próprio resumo financeiro e geração de mensalidades.
- Dados de demonstração: o conjunto atual vai para Academia, e entram poucos dados em Personal (2 ou 3 alunos com mensalidade) e Pessoal (o próprio instrutor e um amigo, com treino), para mostrar a troca de perfil na apresentação. Cada perfil recebe o catálogo de exercícios de demonstração.

---

## Acabamento visual do app inteiro ("gás visual")

Objetivo: o app mais bonito e organizado, **sem mudar o funcionamento nem a paleta**. Movimento curto e com propósito; nada que atrase o toque.

### G1. Barra de abas (correção)
Problemas de hoje:
- Os nomes aparecem cortados ("Aluno", "Exercíci…", "Trein…"): o texto foi colocado dentro do espaço do ícone, que é estreito.
- Ao tocar, o item "sobe": o tracinho amarelo só existe na aba ativa e empurra o conteúdo.
Esperado:
- Nomes completos nas cinco abas (Alunos, Exercícios, Treinos, Financeiro, Perfil), sem corte, com o mesmo tamanho de texto.
- Nada se desloca ao trocar de aba: o espaço do indicador existe sempre.
- Indicador da aba ativa em formato de "pílula" arredondada atrás do ícone (azul bem claro), que aparece com transição suave; ícone e texto da ativa em azul.
- Ao tocar: leve aumento do ícone com efeito de mola (curto) e vibração leve também no Android.
- Área de toque mínima de 44px e leitor de tela informando a aba selecionada.

### G2. Cabeçalhos
- Nenhum ícone sem ação no topo de nenhuma aba (inclui o ☰ do Financeiro e o lápis do Perfil). Substitui as notas A1, E1 e T1.

### G3. Base visual comum
- Cores, raios de borda (8px e 12px), espaçamentos e sombra leve definidos em um único lugar e usados por todas as telas (hoje cada tela repete as próprias cores).
- Componentes reaproveitados: etiqueta (ícone + texto), avatar com iniciais, estado vazio (ícone grande + frase + ação) e botão flutuante.

### G4. Etiquetas com ícone (cor nunca sozinha)
- Turno: manhã (sol), tarde (pôr do sol), noite (lua).
- Situação da mensalidade: pago (check), a vencer (relógio), atrasado (alerta).
- Categoria da despesa: aluguel (casa), energia e água (raio), salários (pagamento), equipamentos (haltere), manutenção (ferramenta), marketing (megafone), outros (reticências).
- Perfis: Academia (loja), Personal (corrida), Pessoal (pessoa).

### G5. Avatares
- Círculo com as iniciais do aluno (fundo azul claro, letras azul escuro) na lista de Alunos, no cartão de treino e no topo da tela do aluno.

### G6. Movimento (inspirado no Tarefas Express)
1. Listas (alunos, exercícios, treinos, pendências): itens entram em cascata, cada um ~60ms depois do anterior, só na primeira carga e no máximo nos 8 primeiros.
2. Troca entre Atual, Evolução e Histórico: conteúdo entra com fade e leve subida (~250ms).
3. Botões e cartões tocáveis: leve "afundar" ao pressionar (escala 0,97) e voltar com mola.
4. "Pago" no Financeiro: o item dá um flash verde rápido antes de sair da lista de pendências.
5. Pastas do Histórico abrem e fecham com animação de altura.
6. Gráfico anima a linha ao trocar de métrica (já previsto em A4).
7. Se o celular estiver com "remover animações" ativado, as animações são desligadas.
- Fica de fora: pulsação contínua de selos (distrai em uso diário).

### Fora do escopo do acabamento
- Trocar paleta, fontes ou criar modo escuro.
- Imagens externas ou ilustrações baixadas.

---

## Ordem de implementação proposta

Cada parte termina com teste no Expo Go e commit próprio; se o tempo acabar, o app continua funcionando com as partes já feitas.

1. **Base visual e barra de abas** — G1, G2, G3 (o resto depende dela).
2. **Tela do aluno** — A2 a A5.
3. **Treinos** — T2 a T4.
4. **Acabamento** — G4, G5, G6 nas telas.
5. **Perfis no backend** — entidade, migration (dados atuais para Academia), filtros, financeiro por perfil, `seed_demo`, testes.
6. **Perfis no app** — perfil ativo lembrado no aparelho, filtro em todas as telas, tela Perfil, indicação do perfil no topo.
7. **Versão 0.1.2** (`versionCode` 3), deploy do backend e build do APK.

---

## Status (10/11) — implementado

Todos os itens acima foram implementados e viraram specs:

| Parte | Spec |
|---|---|
| Barra de abas, cabeçalhos, base visual, etiquetas, avatares, movimento (G1–G6, A1, E1, T1) | `specs/acabamento-visual-v012.md` |
| Tela do aluno (A2–A5) | `specs/tela-aluno-v012.md` |
| Treinos (T2–T4) | descrito em T2–T4 acima (sem spec separada) |
| Perfis (backend e app) | `specs/perfis.md` |
| Dados de demonstração com os três perfis | `specs/dados-demonstracao.md` (atualizada) |

Verificação: `tsc` sem erros, lint sem erros, 27 testes do backend passando (11 novos de perfis), migration testada em banco vazio e em banco com dados (tudo foi para Academia), telas conferidas renderizadas.

Versão do app: **0.1.2** (`versionCode` 3).
