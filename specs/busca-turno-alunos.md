# Spec — Busca e turnos na tela de Alunos

## Contexto
Com a lista de alunos crescendo, o instrutor precisa achar um aluno específico rápido, e também enxergar só quem treina em determinado horário do dia.

## Alteração no modelo
- Aluno ganha o campo `turno`, com três opções fixas: `manha`, `tarde`, `noite` (ver `cadastro-alunos.md`)
- Campo obrigatório no cadastro/edição do aluno

## Funcionalidade

**Busca**
- Campo de busca fixo no topo da tela Alunos
- Filtra a lista em tempo real (a cada letra digitada), por nome do aluno
- Não diferencia maiúsculas/minúsculas nem acentos

**Turnos**
- Logo abaixo da busca, um seletor com 4 opções: Todos, Manhã, Tarde, Noite
- Ao selecionar um turno, a lista mostra só os alunos daquele turno
- Busca e filtro de turno funcionam juntos (ex: buscar "João" dentro do turno "Manhã")

## Critérios de aceite
- [ ] Buscar por um nome parcial já filtra a lista (não precisa digitar o nome completo)
- [ ] Trocar o turno selecionado atualiza a lista imediatamente
- [ ] Selecionar "Todos" remove o filtro de turno, mantendo a busca por nome se houver
- [ ] Um aluno sem turno definido não pode ser salvo (campo obrigatório)
