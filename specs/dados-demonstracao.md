# Spec — Dados de demonstração

## Contexto
Para apresentar o app a várias pessoas, o banco precisa estar com informações que mostrem todas as telas funcionando: lista de alunos de vários perfis, evolução de medidas, treinos adaptados e um financeiro com receita, despesa e inadimplência. Esses dados são **inteiramente fictícios** e não devem ser confundidos com dados reais do studio.

## Funcionalidade
Um comando do backend (`seed_demo`) que o desenvolvedor executa no servidor e que cria:

| Área | O que é criado |
|---|---|
| **Alunos** | Academia: 14 alunos fictícios (os três turnos, idades de adolescente a idoso, mensalidades de valores diferentes, um cortesia e um inativo). Personal: 3 clientes de atendimento externo com mensalidade. Pessoal: o treino próprio do instrutor e o de um amigo, sem mensalidade |
| **Medidas** | 6 alunos (5 da Academia e 1 do Personal) com 3 a 6 avaliações cada, mostrando uma evolução coerente (emagrecimento, ganho de massa, manutenção) |
| **Exercícios** | Um catálogo de 18 exercícios por grupo muscular **em cada perfil** (ver `specs/perfis.md`) |
| **Treinos** | 13 treinos (9 na Academia, 2 no Personal, 2 no Pessoal), incluindo adaptados para idosos e adolescente |
| **Mensalidades** | Os últimos 6 meses, com crescimento da receita, a maioria paga e alguns pagamentos em aberto (atrasados de meses anteriores e a vencer no mês atual) |
| **Despesas** | Os últimos 6 meses, por categoria, na Academia; transporte e acessórios no Personal |

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
- [ ] Após rodar o comando, o perfil Academia lista 14 alunos, o Personal 3 e o Pessoal 2.
- [ ] A aba Financeiro mostra receita crescente no gráfico dos 6 meses, saldo positivo no mês atual e pelo menos dois alunos em atraso.
- [ ] Pelo menos cinco alunos têm gráfico de evolução e tabela comparativa com mais de uma avaliação.
- [ ] Rodar o comando duas vezes seguidas resulta na mesma quantidade de registros.
- [ ] Rodar com `--limpar` remove os dados de demonstração e preserva qualquer outro aluno cadastrado.
- [ ] Nenhuma mensalidade paga, despesa ou avaliação fica com data futura.
- [ ] Os testes existentes do backend continuam passando.
