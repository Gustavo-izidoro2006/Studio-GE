# Spec — APK da versão 0.1 (teste com o cliente)

## Contexto
Versão de teste para mostrar ao cliente, instalada direto no celular, sem o Expo Go e sem o computador rodando o Expo. O backend (Django) **continua rodando no computador** do desenvolvedor, na mesma rede Wi-Fi do celular. O app não funciona sozinho, sem o backend.

## Identidade do app
- Nome exibido no celular: **Studio GE**.
- Versão: **0.1.0**.
- Identificador único do pacote Android: `com.studioge.app`.

## Geração do APK
- O build gera um arquivo **APK** (instalável direto), não um pacote para loja.
- Perfil de build chamado `preview`, para testes internos.
- O build é feito pelo serviço de build do Expo (EAS), com o comando `eas build -p android --profile preview`.

## Comunicação com o backend
- O app usa o endereço único de `mobile/constants/api.ts`, sem mudar o valor nesta tarefa.
- O APK instalado precisa aceitar conexão HTTP (sem certificado) com o backend, porque a v0.1 conversa com o computador pela rede local. Sem isso o Android bloqueia as chamadas e o app abre vazio.
- Quando o backend for para a nuvem (HTTPS), essa permissão deve ser removida. Fica registrado como pendência.

## Fora do escopo
- Backend na nuvem (PythonAnywhere) e endereço público.
- Publicação na Play Store.
- Ícone e tela de abertura definitivos (ficam os do modelo padrão por enquanto).
- Atualizações automáticas (`eas update`).

## Critérios de aceite
- [ ] O build termina sem erro e entrega um link para baixar o APK.
- [ ] O APK instala no celular e aparece como "Studio GE", versão 0.1.0.
- [ ] O app abre sem o Expo Go e sem o servidor do Expo rodando no computador.
- [ ] Com o backend ligado e o celular na mesma rede, as listas de alunos, exercícios, treinos e o financeiro carregam.
- [ ] Cadastrar e editar (aluno, despesa) funciona no APK.
- [ ] O endereço do backend continua em um único lugar: `mobile/constants/api.ts`.
- [ ] Nenhum segredo ou arquivo de banco é versionado.
