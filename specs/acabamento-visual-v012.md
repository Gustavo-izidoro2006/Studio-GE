# Spec — Acabamento visual v0.1.2

Origem: `docs/ajustes-finais-v012.md` (itens G1 a G6). Objetivo: um app mais bonito e organizado **sem mudar o funcionamento nem a paleta** (azul #185FA5, amarelo #EF9F27, branco).

## G1 — Barra de abas
- As cinco abas mostram o nome inteiro (Alunos, Exercícios, Treinos, Financeiro, Perfil), sem corte, no mesmo tamanho de texto.
- Trocar de aba não desloca nada: o indicador ocupa sempre o mesmo espaço.
- A aba ativa tem uma "pílula" azul-clara atrás do ícone, que aparece com transição suave; ícone e texto da ativa em azul.
- Ao tocar: leve aumento do ícone com efeito de mola e vibração leve (Android e iOS).
- Cada aba é tocável em pelo menos 44px e o leitor de tela anuncia a aba selecionada.
- A barra fica acima dos botões/gestos do sistema (como em `specs/ajustes-visuais-v01.md`).

## G2 — Cabeçalhos
- Nenhum ícone sem ação no topo de nenhuma aba. Ações reais (ex.: "+ Despesa" no Financeiro) continuam.

## G3 — Base visual comum
- Cores, raios (8px e 12px), espaçamentos, sombras e tempos de animação ficam em um único arquivo e são usados por todas as telas.
- Componentes reaproveitados: etiqueta (ícone + texto), avatar com iniciais, estado vazio (ícone + frase + ação), botão flutuante (redondo ou com texto) e botão que "afunda" ao toque.
- Texto de apoio com contraste de pelo menos 4,5:1 sobre o fundo.

## G4 — Etiquetas com ícone
A cor nunca carrega o significado sozinha.
- Turno: manhã (sol), tarde (pôr do sol), noite (lua).
- Mensalidade: pago (check), a vencer (relógio), atrasado (alerta).
- Despesa: aluguel (casa), energia e água (raio), salários (pagamento), equipamentos (haltere), manutenção (ferramenta), marketing (megafone), outros (reticências).
- Perfis: Academia (loja), Personal (corrida), Pessoal (pessoa).

## G5 — Avatares
- Círculo com as iniciais do aluno na lista de Alunos, no cartão de treino e no topo da tela do aluno.

## G6 — Movimento
1. Listas entram em cascata (~60ms entre itens), só na carga, no máximo nos 8 primeiros.
2. Troca entre Atual, Evolução e Histórico: conteúdo entra com fade e leve subida (~250ms).
3. Botões e cartões tocáveis "afundam" levemente ao toque e voltam com mola.
4. "Pago" no Financeiro: flash verde rápido no item antes de ele sair das pendências.
5. Pastas do Histórico abrem e fecham com animação.
6. O gráfico anima a linha ao trocar de métrica.
7. Com "remover animações" ativado no celular, as animações são desligadas.

## Fora do escopo
- Trocar paleta ou fontes, modo escuro, imagens externas.
- Pulsação contínua de selos.

## Critérios de aceite
- [ ] Nenhum nome de aba aparece cortado num celular de 360dp de largura.
- [ ] Tocar nas abas não faz nenhum elemento da barra subir ou descer.
- [ ] Nenhum ícone do cabeçalho deixa de executar uma ação.
- [ ] Nenhuma tela declara a própria paleta de cores; todas usam a base comum.
- [ ] Etiquetas de turno, situação e categoria têm ícone e texto.
- [ ] Com "remover animações" ativado, nenhuma animação de entrada acontece.
- [ ] O `tsc` passa sem erros.
