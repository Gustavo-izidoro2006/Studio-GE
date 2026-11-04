# Studio GE

App Android de gestão para o **Studio Geração Energia**, de uso exclusivo do dono/instrutor: alunos, medidas corporais, exercícios, treinos personalizados e financeiro do studio, tudo em um só lugar.

Projeto de Extensão do curso de Análise e Desenvolvimento de Sistemas (ADS), feito para um cliente real. O escopo foi definido depois de uma entrevista com o dono do studio, por isso o app **não é usado pelos alunos**: é uma ferramenta interna do instrutor.

**Versão atual:** 0.1.1 (APK de teste) · **Backend em produção:** https://studioge.pythonanywhere.com/api

---

## Funcionalidades

| Aba | O que faz |
|---|---|
| **Alunos** | Cadastro, busca por nome e filtro por turno (manhã, tarde, noite). Tela do aluno com medidas, evolução e treinos. |
| **Medidas e evolução** | Avaliações com peso, altura, circunferências e dobras cutâneas. O IMC é calculado sozinho. Três abas: *Atual*, *Evolução* (gráfico por métrica e tabela comparativa configurável) e *Histórico*. |
| **Exercícios** | Catálogo dos exercícios da academia, por grupo muscular. |
| **Treinos** | Montagem do treino de cada aluno (séries, repetições e carga) com campo de adaptação para alunos específicos. |
| **Financeiro** | Mensalidades por aluno (valor e dia de vencimento), marcação de pago/desfazer, despesas por categoria, resumo mensal (recebido, despesas, saldo, a receber), inadimplência, pagamentos em atraso e a vencer, e gráfico de receita x despesa dos últimos 6 meses. |
| **Perfil** | Aba reservada; a tela ainda é um placeholder. |

O financeiro **não processa pagamentos**: ele só guarda as marcações feitas pelo instrutor. Nenhum dado bancário ou de cartão é armazenado.

---

## Tecnologias

- **Mobile:** React Native + Expo (SDK 54), expo-router (rotas por arquivos), TypeScript, react-native-gifted-charts
- **Backend:** Python, Django, Django REST Framework, django-cors-headers
- **Banco de dados:** SQLite
- **Build do APK:** EAS Build (Expo)
- **Hospedagem do backend:** PythonAnywhere
- **Método:** Spec-Driven Development (SDD), com apoio do GitHub Copilot

---

## Estrutura do repositório

```
Studio-GE/
├── backend/   # API Django + DRF (app "core": models, serializers, views, testes)
├── mobile/    # App Expo (telas em app/, componentes, constants/api.ts)
├── specs/     # Specs de cada funcionalidade: dizem O QUÊ, nunca o COMO
├── docs/      # Escopo, persona e requisitos
└── CLAUDE.md  # Regras de trabalho do projeto
```

---

## Como rodar localmente

### Pré-requisitos
- Python 3 e Node.js (LTS)
- Celular com o app **Expo Go**, ou um emulador Android

### 1. Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# Linux / macOS
source venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

Sem nenhuma variável de ambiente, o backend roda em **modo desenvolvimento** (debug ligado, qualquer host aceito, CORS liberado).

Para popular o banco com dados **fictícios** de demonstração (14 alunos, medidas, treinos, mensalidades e despesas dos últimos 6 meses):

```bash
python manage.py seed_demo            # recria os dados de demonstração
python manage.py seed_demo --limpar   # só remove os dados de demonstração
```

O comando é seguro para repetir e não mexe em nenhum outro dado do banco.

### 2. Mobile

Em outro terminal:

```bash
cd mobile
npm install
npx expo start
```

Escaneie o QR code com o Expo Go. O celular precisa estar na **mesma rede Wi-Fi** do computador.

### Endereço da API

O app escolhe o backend sozinho (lógica única em `mobile/constants/api.ts`):

| Ambiente | Endereço usado |
|---|---|
| APK / build de distribuição | Sempre a nuvem (`studioge.pythonanywhere.com`) |
| Desenvolvimento (Expo Go, emulador, web) | O backend do mesmo computador, na porta 8000 (descoberto automaticamente) |
| Desenvolvimento apontando para a nuvem | Defina `EXPO_PUBLIC_API_URL` em `mobile/.env.local` |

### Testes do backend

```bash
cd backend
python manage.py test
```

---

## Endpoints principais da API

Todos sob `/api/`:

| Rota | Descrição |
|---|---|
| `alunos/` · `medidas/` | Alunos e suas avaliações corporais |
| `exercicios/` · `treinos/` · `itens-treino/` | Catálogo e treinos |
| `mensalidades/` · `despesas/` | Cobranças dos alunos e despesas do studio |
| `financeiro/gerar-mensalidades/` | `POST`: gera as mensalidades do mês para os alunos ativos |
| `financeiro/resumo/` | `GET`: resumo do mês (recebido, despesas, saldo, a receber, inadimplência, série de 6 meses) |

---

## Gerando o APK

```bash
cd mobile
eas build -p android --profile preview
```

O perfil `preview` gera um **APK** instalável direto no celular (sem loja). O APK sempre aponta para o backend na nuvem, sem ajuste manual antes do build.

## Backend em produção

O backend detecta produção pela variável `DJANGO_SECRET_KEY`. Quando ela existe:

- `DEBUG` fica desligado
- só os hosts de `DJANGO_ALLOWED_HOSTS` (separados por vírgula) são aceitos
- CORS deixa de liberar todas as origens

| Variável | Para que serve |
|---|---|
| `DJANGO_SECRET_KEY` | Chave secreta do Django (nunca versionada) |
| `DJANGO_ALLOWED_HOSTS` | Ex.: `studioge.pythonanywhere.com` |

Fuso horário `America/Sao_Paulo` e idioma `pt-br`, porque o financeiro calcula "hoje" para definir pagamentos e atrasos.

---

## Como o projeto é desenvolvido

O projeto segue **Spec-Driven Development**: nenhuma funcionalidade é implementada sem uma spec em [`specs/`](specs/).

1. Decisões de arquitetura (modelagem, endpoints, trade-offs)
2. Spec da funcionalidade (campos, fluxo de telas e critérios de aceite)
3. Implementação em camadas: **model → migration → admin → API → mobile**

Convenções importantes (detalhes em [`CLAUDE.md`](CLAUDE.md)):

- Dinheiro sempre em `DecimalField`, nunca `float`
- Valores derivados (IMC, saldo, status de pagamento) são calculados, nunca digitados
- Paleta: azul `#185FA5`, amarelo `#EF9F27`, fundo branco
- Áreas de toque de no mínimo 44px, e informação nunca depende só de cor
- Nunca versionar `SECRET_KEY`, `.env` ou `db.sqlite3`

## Documentação

- [`docs/escopo.md`](docs/escopo.md): objetivo, funcionalidades e o que ficou de fora
- [`docs/persona.md`](docs/persona.md): quem usa o app e o que precisa dele
- [`docs/requisitos-financeiro.md`](docs/requisitos-financeiro.md): requisitos do módulo financeiro
- [`specs/`](specs/): uma spec por funcionalidade (alunos, medidas, evolução, treinos, financeiro, APK, nuvem etc.)

---

## Roadmap

- [ ] **Autenticação na API**: obrigatória antes de usar dados reais de alunos (hoje a API não tem login)
- [ ] Ícone e tela de abertura definitivos (hoje são os do modelo padrão do Expo)
- [ ] Atualizações automáticas com EAS Update
- [ ] Publicação na Play Store

**Fora do escopo:** acesso do aluno ao app, vídeos de exercícios, notificações, cronômetro de descanso e processamento real de pagamentos (Pix, cartão, boleto).

---

## Autoria

Desenvolvido por **Gustavo Izidoro Barboza Oliveira** (ADS, UniPac Uberlândia) para o Studio Geração Energia.
