# Spec — Dados de demonstração

## Contexto
Para apresentar o app a várias pessoas, o banco precisa estar com informações que mostrem todas as telas funcionando: lista de alunos de vários perfis, evolução de medidas, treinos adaptados e um financeiro com receita, despesa e inadimplência. Esses dados são **inteiramente fictícios** e não devem ser confundidos com dados reais do studio.

## Funcionalidade
Um comando do backend (`seed_demo`) que o desenvolvedor executa no servidor e que cria:

| Área | O que é criado |
|---|---|
| **Alunos** | 14 alunos fictícios: os três turnos, idades de adolescente a idoso, mensalidades de valores diferentes, um aluno com mensalidade cortesia (sem valor) e um aluno inativo |
| **Medidas** | 5 alunos com 3 a 6 avaliações cada, mostrando uma evolução coerente (emagrecimento, ganho de massa, manutenção), para o gráfico e a tabela comparativa |
| **Exercícios** | Um catálogo de 18 exercícios por grupo muscular |
| **Treinos** | 9 treinos para 6 alunos, incluindo treinos adaptados para idosos e adolescente, com observações e adaptações por exercício |
| **Mensalidades** | Os últimos 6 meses, com crescimento da receita, a maioria paga e alguns pagamentos em aberto (atrasados de meses anteriores e a vencer no mês atual) |
| **Despesas** | Os últimos 6 meses, por categoria (aluguel, energia e água, salários, marketing, manutenção, equipamentos, outros) |

## Regras
- **As datas acompanham o dia em que o comando roda:** os meses, os vencimentos e os pagamentos são calculados a partir de "hoje", de modo que sempre haja pagamentos atrasados, a vencer e pagos, e nenhum registro fique no futuro.
- **Pode ser executado várias vezes:** cada execução remove os dados de demonstração anteriores e cria tudo de novo, sem duplicar.
- **Só mexe nos próprios dados:** remove apenas alunos (e seus registros), mensalidades e despesas que ele mesmo cria, identificados pelos nomes e descrições fixos. Qualquer outro dado do banco permanece. O catálogo de exercícios é criado sem duplicar e não é removido.
- **Limpeza:** com a opção `--limpar`, o comando só remove os dados de demonstração e não cria nada.
- Nomes e telefones são inventados; os telefones usam um padrão claramente falso.
- Ao terminar, mostra quanto foi criado.

## Fora do escopo
- Uso com dados reais do studio.
- Criar usuários ou qualquer tipo de login.
- Alterar telas, API ou regras do app.

## Critérios de aceite
- [ ] Após rodar o comando, o app lista 14 alunos de turnos e idades variados.
- [ ] A aba Financeiro mostra receita crescente no gráfico dos 6 meses, saldo positivo no mês atual e pelo menos dois alunos em atraso.
- [ ] Pelo menos cinco alunos têm gráfico de evolução e tabela comparativa com mais de uma avaliação.
- [ ] Rodar o comando duas vezes seguidas resulta na mesma quantidade de registros.
- [ ] Rodar com `--limpar` remove os dados de demonstração e preserva qualquer outro aluno cadastrado.
- [ ] Nenhuma mensalidade paga, despesa ou avaliação fica com data futura.
- [ ] Os testes existentes do backend continuam passando.
