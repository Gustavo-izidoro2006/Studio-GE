# Studio GE

App Android de gestão para o dono de um studio de treino (uso exclusivo do instrutor).
Monorepo: `backend/` (Django + DRF, SQLite), `mobile/` (Expo + expo-router), `specs/`, `docs/`.

## Como trabalhar
- Antes de implementar uma funcionalidade, leia a spec correspondente em `specs/`.
- Specs dizem O QUÊ; não altere o escopo definido nelas.
- Ordem das camadas: model → migration → admin → API → mobile.
- Uma funcionalidade por vez, mudanças pequenas.
- Não mexa em arquivos fora do escopo pedido.
- Antes de editar vários arquivos, liste quais vai alterar.

## Convenções
- Dinheiro sempre em DecimalField, nunca float.
- Valores derivados (IMC, saldo, status de pagamento) são calculados, nunca digitados.
- Paleta: azul #185FA5, amarelo #EF9F27, fundo branco. Áreas de toque mínimas de 44px.
- Nunca versionar SECRET_KEY, .env, db.sqlite3.

## Comandos
- Backend: `cd backend && python manage.py runserver 0.0.0.0:8000`
- Mobile: `cd mobile && npx expo start`

## Sobre o usuário
Estudante de ADS, ainda aprendendo. Explique o porquê em poucas linhas e responda em português.
