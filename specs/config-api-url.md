# Spec — Endereço da API em um único lugar

## Contexto
Hoje o endereço do backend (IP da máquina + porta) está escrito diretamente em 4 telas do app mobile. Toda vez que o IP muda, ou quando o backend for para a nuvem (deploy), seria preciso editar os 4 arquivos. O endereço deve existir em um único lugar.

## Funcionalidade
- Existe um único ponto de configuração com o endereço base da API.
- As telas Alunos, Exercícios, Treinos e Detalhe do aluno (medidas) montam suas rotas a partir desse endereço base, sem repetir IP ou porta.
- O valor atual do endereço não muda nesta tarefa — só passa a morar em um lugar só.

## Fora do escopo
- Trocar o endereço para o servidor na nuvem (tarefa separada, do deploy).
- Alterar qualquer comportamento, visual ou regra das telas.

## Critérios de aceite
- [ ] Nenhuma tela contém IP, host ou porta escritos diretamente.
- [ ] Alterar o endereço base no ponto único muda o endereço usado por todas as telas.
- [ ] As telas Alunos, Exercícios, Treinos e Detalhe do aluno carregam e salvam dados como antes.
- [ ] Nenhum arquivo fora do app mobile é alterado.
