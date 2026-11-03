# Spec — Correção: estilos faltando na tela de Treinos

## Contexto
A verificação de tipos (`tsc`) acusa erro em `mobile/app/(tabs)/treinos.tsx`: o arquivo usa estilos que não foram definidos (`sectionTitle`, `savedTitleRow`, `select`, `selectText`, `smallLabel`, `smallInput`) e há um erro de tipo na linha do botão/lista de itens. Na tela, isso deixa títulos de seção, seletor de aluno e campos pequenos sem a formatação prevista.

## Funcionalidade
- Os seis estilos passam a existir, com aparência coerente com as outras telas do app (mesma paleta, bordas, espaçamentos e tamanhos de texto dos formulários de Alunos e Exercícios).
- O erro de tipo restante no arquivo é corrigido sem mudar o comportamento.
- O comportamento da tela não muda: listar treinos salvos, escolher aluno, montar treino com exercícios, salvar.

## Fora do escopo
- Redesenhar a tela ou mudar textos, cores da paleta ou funcionalidades.
- Alterar qualquer arquivo além de `mobile/app/(tabs)/treinos.tsx`.

## Critérios de aceite
- [ ] `npx tsc --noEmit` na pasta `mobile` termina sem erros.
- [ ] Títulos de seção ("Treinos salvos", etc.) aparecem em destaque.
- [ ] O seletor de aluno parece um campo tocável (borda, texto, ícone de abrir lista) e tem área de toque de pelo menos 44px.
- [ ] Os campos pequenos (séries, repetições, carga) têm borda, rótulo legível e tamanho adequado para digitar.
- [ ] Listar, montar e salvar treino continuam funcionando.
- [ ] Nenhum outro arquivo é alterado.
