# Spec — Endereço da API por ambiente

## Contexto
O endereço do backend fica em um único lugar (`mobile/constants/api.ts`, ver `specs/config-api-url.md`). Mas hoje ele é trocado à mão: quem desenvolve aponta para o computador local e quem gera o APK precisa lembrar de voltar para a nuvem. Em 03/11 um commit deixou `http://localhost:8000/api` no código, e um APK gerado assim não conseguiria falar com o servidor.

## Funcionalidade
O app escolhe o endereço sozinho, conforme o ambiente:

| Ambiente | Endereço usado |
|---|---|
| **APK / build de distribuição** | Sempre a nuvem: `https://studioge.pythonanywhere.com/api`. Nada o altera. |
| **Desenvolvimento** (Expo Go, emulador ou web) | O backend rodando no mesmo computador que serve o app, na porta 8000. O endereço do computador é descoberto automaticamente; ninguém precisa digitar IP. |
| **Desenvolvimento apontando para a nuvem** (opcional) | Se existir a variável `EXPO_PUBLIC_API_URL` no arquivo `mobile/.env.local`, ela substitui o endereço de desenvolvimento. Serve para testar a nuvem pelo Expo Go. |

- O arquivo `.env.local` nunca é versionado (já está no `.gitignore`).
- A variável opcional **só vale em desenvolvimento**; um APK ignora qualquer variável e usa a nuvem.
- Continua existindo um único arquivo com a lógica de endereço, e nenhuma tela escreve endereço diretamente.

## Versão do app
Esta entrega sobe a versão do app para `0.1.1` (código de versão Android `2`), para que o novo APK possa ser instalado por cima do `0.1.0`.

## Fora do escopo
- Modo túnel do Expo (o endereço descoberto não vale nele; usar a variável opcional).
- Qualquer mudança em telas, backend ou regras.

## Critérios de aceite
- [ ] Um APK gerado pelo perfil `preview` usa `https://studioge.pythonanywhere.com/api`, sem nenhum ajuste manual antes do build.
- [ ] No Expo Go, com o backend local rodando, o app acessa o backend do computador sem editar nenhum arquivo.
- [ ] Com `EXPO_PUBLIC_API_URL` definida em `mobile/.env.local`, o Expo Go usa esse endereço.
- [ ] Nenhuma tela contém endereço escrito diretamente.
- [ ] `app.json` indica versão `0.1.1` e código de versão Android `2`.
- [ ] O `tsc` passa sem erros e nenhum arquivo fora de `mobile/` e `specs/` é alterado.
