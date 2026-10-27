# Spec — Configuração do APK v0.1

## Contexto
O backend já roda na nuvem (PythonAnywhere). Esta spec aponta o app para ele e prepara a identidade e o perfil de build do primeiro APK de teste (v0.1), instalável direto no celular, sem Expo Go e usando dados móveis.

## Funcionalidade
1. **Endereço da API:** o app passa a usar `https://studioge.pythonanywhere.com/api`. Continua existindo em um único lugar (`mobile/constants/api.ts`, conforme `specs/config-api-url.md`). Para voltar a testar com o backend local, basta trocar só essa linha.
2. **Identidade do app:**
   - Nome exibido no celular: **Studio GE**
   - Identificador interno (slug): `studio-ge`
   - Versão: `0.1.0`
   - Identificador do pacote Android: `com.studioge.app`
3. **Perfil de build "preview":** gera um arquivo **APK** instalável direto no celular (não um pacote de loja), com distribuição interna.

## Fora do escopo
- Ícone e tela de abertura personalizados (continuam os padrões do Expo nesta versão).
- Login/autenticação (spec própria, antes de dados reais).
- Publicação na Play Store.
- Alterar telas, regras ou backend.

## Critérios de aceite
- [ ] Nenhuma tela contém endereço escrito diretamente; o endereço da nuvem está só em `constants/api.ts`.
- [ ] O app, aberto no Expo Go, lista e grava dados lendo da nuvem.
- [ ] `app.json` tem nome "Studio GE", versão `0.1.0` e pacote `com.studioge.app`.
- [ ] Existe um perfil de build chamado `preview` que gera APK.
- [ ] Nenhum arquivo fora de `mobile/` é alterado.
- [ ] O `tsc` passa sem erros.
