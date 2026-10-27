# Escopo do projeto — Studio GE

## Objetivo
App Android de uso exclusivo do dono/instrutor do Studio Geração Energia, para gerenciar alunos, medidas corporais, catálogo de exercícios, treinos personalizados e o financeiro do studio.

## Contexto
Projeto de Extensão (curso de ADS). Escopo definido após entrevista com o cliente real (dono do studio). O app **não** é usado pelos alunos — é uma ferramenta interna do instrutor.

## Público-alvo
Instrutor/dono do Studio Geração Energia. Perfil não-técnico, precisa de interface simples e direta.

## Funcionalidades da v1 (protótipo)
- Cadastro de alunos
- Registro de medidas corporais e cálculo automático de IMC
- Catálogo de exercícios da academia
- Montagem de treino por aluno (exercícios + séries/repetições/carga)
- Adaptação de treino para alunos específicos
- Financeiro: mensalidades dos alunos, despesas do studio, resumo mensal (recebido, despesas, saldo, a receber), inadimplência e gráfico de receita x despesa

## Fora do escopo (por enquanto)
- Acesso do aluno ao app (login, visualização do próprio treino)
- Vídeos de exercícios
- Notificações de sessão
- Cronômetro de série/descanso
- Processamento de pagamento real (Pix, cartão, boleto): o financeiro só registra marcações manuais do instrutor

As quatro primeiras eram ideias da fase inicial do projeto, descartadas após a entrevista com o cliente.

## Stack técnica
- Mobile: React Native + Expo
- Backend: Python (Django)
- Banco de dados: SQLite (local, fase de protótipo)
- Método de trabalho: Spec-Driven Development (specs em `specs/`)
