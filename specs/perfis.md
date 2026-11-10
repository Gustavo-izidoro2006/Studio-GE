# Spec — Perfis de trabalho

Origem: `docs/ajustes-finais-v012.md` (aba Perfil), decisões do usuário em 10/11.

## Contexto
O instrutor trabalha em contextos diferentes e não quer misturar os dados: o próprio studio, atendimentos de personal em outros lugares e o próprio treino (e de amigos). Cada perfil é uma "pré-definição": escolhido um perfil, o app mostra só os dados dele.

## Funcionalidade
- **Três perfis fixos**, criados automaticamente: Academia, Personal e Pessoal. Não é possível criar nem excluir perfis; o **nome** de cada um pode ser editado (ex.: "Studio Geração Energia").
- **Separado por perfil:**
  - alunos e tudo que é deles (avaliações, treinos e itens de treino);
  - **catálogo de exercícios** (cada perfil tem o seu);
  - **financeiro**: mensalidades, despesas, geração mensal, resumo, pendências e histórico de pagamentos.
- Um treino só pode usar exercícios do mesmo perfil do aluno.
- A mensalidade guarda o próprio perfil: se o aluno for excluído, o histórico continua no perfil certo.
- Os dados existentes antes desta versão passam para o perfil **Academia**.

## Comportamento da API
- Listas e o resumo financeiro aceitam `?perfil=<id>` e mostram só aquele perfil.
- **Sem perfil informado, vale Academia** — o APK 0.1.1 já instalado continua funcionando, vendo só a Academia.
- Criar aluno, exercício ou despesa sem perfil no corpo usa o perfil da requisição.
- Buscar, editar ou excluir um item pelo id funciona em qualquer perfil (telas de detalhe não quebram).
- Perfil inexistente responde erro 400.
- `GET /api/perfis/` lista os três com a quantidade de alunos; `PATCH /api/perfis/<id>/` renomeia (nome vazio é recusado).

## App
- A aba **Perfil** mostra os três perfis como cartões (ícone, nome, nº de alunos), com o ativo marcado. Tocar em outro cartão troca o perfil ativo; há um botão para renomear.
- O perfil ativo aparece sempre no cabeçalho das abas, abaixo do título, para nunca haver dúvida de onde se está.
- O app lembra o último perfil escolhido ao ser reaberto.
- Ao trocar de perfil, todas as abas passam a mostrar os dados do novo perfil.
- Ícones: Academia (loja), Personal (corrida), Pessoal (pessoa).

## Fora do escopo
- Login/senha por perfil.
- Mover um aluno de um perfil para outro pelo app.
- Criar perfis além dos três.

## Critérios de aceite
- [ ] Depois da migration, todos os dados antigos aparecem no perfil Academia.
- [ ] Um aluno cadastrado em Personal não aparece em Academia nem em Pessoal.
- [ ] O financeiro de cada perfil soma só as próprias mensalidades e despesas.
- [ ] Ao montar treino de um aluno de Personal, só aparecem exercícios de Personal.
- [ ] Renomear um perfil muda o nome no cabeçalho e na aba Perfil.
- [ ] Fechar e reabrir o app mantém o último perfil escolhido.
- [ ] Sem `?perfil=`, a API se comporta como antes (Academia).
- [ ] Os testes do backend passam.
