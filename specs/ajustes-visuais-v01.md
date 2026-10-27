# Spec — Ajustes visuais v0.1

## Contexto
Testes no celular real mostraram dois problemas que atrapalham o uso do instrutor. Esta spec não muda funcionalidades, só a aparência e o posicionamento.

## Ajuste 1 — Marcador de campo obrigatório
**Hoje:** os rótulos de campos obrigatórios terminam com um asterisco (`Nome *`, `Turno *`, `Valor (R$) *`). Para um usuário não técnico o símbolo não é claro.

**Esperado:**
- Campo obrigatório mostra a palavra **(obrigatório)** logo após o rótulo, em texto menor e cinza (ex.: `Nome (obrigatório)`).
- Nenhum rótulo do app contém o símbolo `*`.
- Campos opcionais não recebem nenhuma marcação.
- A regra vale em todos os formulários: aluno, exercício, treino, avaliação (medidas) e despesa.
- As regras de validação e as mensagens de erro não mudam.

## Ajuste 2 — Barra de navegação do Android sobre as abas
**Hoje:** no celular, os botões do sistema (voltar, início, recentes) ou a barra de gestos aparecem por cima da barra de abas do app e atrapalham o toque nas abas.

**Esperado:**
- A barra de abas do app fica totalmente **acima** da área do sistema, em aparelhos com 3 botões e em aparelhos com navegação por gestos.
- A altura da barra de abas se ajusta ao espaço que o sistema ocupa, mantendo a altura atual dos ícones e rótulos.
- Nas demais telas (detalhe do aluno, formulários em janela, listas rolando até o fim), nenhum botão nem conteúdo fica escondido atrás da barra do sistema.
- Com o teclado aberto, o campo que está sendo digitado continua visível.
- O visual atual não muda (cores, ícones, indicador amarelo da aba ativa).

## Fora do escopo
- Redesenhar telas, trocar cores ou textos além do marcador "(obrigatório)".
- Alterar o backend.
- Configuração do APK (spec separada).

## Critérios de aceite
- [ ] Nenhum texto visível do app contém `*`.
- [ ] Todo campo obrigatório mostra "(obrigatório)"; os opcionais não mostram nada.
- [ ] As cinco abas ficam totalmente tocáveis, sem ficar sob os botões do Android, nos dois modos de navegação.
- [ ] O último item de cada lista e o botão de salvar de cada formulário ficam visíveis e tocáveis.
- [ ] Digitar em qualquer formulário com o teclado aberto não esconde o campo atual.
- [ ] As telas continuam iguais em cores, ícones e funcionamento.
