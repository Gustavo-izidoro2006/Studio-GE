# Spec — Preparar o backend para a nuvem (v0.1)

## Contexto
O backend hoje só roda no computador do desenvolvedor, com configurações de teste (senha secreta escrita no código, modo de depuração ligado, qualquer endereço aceito). Para o cliente testar o app em outra rede, ele vai rodar na nuvem (PythonAnywhere, plano gratuito). Esta spec torna o backend seguro e correto para isso, **sem mudar nenhuma funcionalidade nem atrapalhar o uso local**.

## Como o sistema distingue produção de desenvolvimento
- **Produção:** existe a variável de ambiente `DJANGO_SECRET_KEY`.
- **Desenvolvimento (computador local):** a variável não existe, e tudo continua funcionando como hoje, sem precisar configurar nada.

## Comportamento em produção
| Item | Regra |
|---|---|
| Chave secreta | Vem da variável `DJANGO_SECRET_KEY`; nunca fica no código versionado |
| Modo de depuração | Desligado (páginas de erro não mostram código nem configurações) |
| Endereços aceitos | Só os listados na variável `DJANGO_ALLOWED_HOSTS` (separados por vírgula), por exemplo `usuario.pythonanywhere.com` |
| CORS | Não libera todas as origens. O app nativo não depende de CORS |
| Arquivos estáticos | Existe uma pasta de destino para coletar os estáticos do painel admin |

## Comportamento em desenvolvimento
Igual ao atual: depuração ligada, qualquer endereço aceito, CORS liberado, chave de desenvolvimento.

## Ajustes valem nos dois ambientes
- **Fuso horário:** `America/Sao_Paulo`. Motivo: o financeiro calcula "hoje" para marcar pagamento e definir atraso. Em UTC, depois das 21h no Brasil o sistema já enxerga o dia seguinte.
- **Idioma:** português do Brasil.
- **requirements.txt:** gravado em UTF-8 (hoje está em UTF-16 e o pip da nuvem não lê) e com as mesmas versões atuais das dependências.
- **.gitignore na raiz do repositório** ignorando: ambiente virtual (`venv/`), banco local (`db.sqlite3`), `__pycache__/`, `*.pyc`, `.env`.
- Se o ambiente virtual ou o banco local já estiverem versionados, saem do versionamento **sem serem apagados do disco**.

## Fora do escopo
- Autenticação/login na API (spec própria, obrigatória antes de dados reais de alunos).
- Trocar SQLite por outro banco.
- O deploy em si (passo manual no PythonAnywhere).
- Qualquer mudança no app mobile.

## Critérios de aceite
- [ ] Sem nenhuma variável de ambiente, `runserver` e o app funcionam exatamente como antes.
- [ ] Com `DJANGO_SECRET_KEY` definida, o servidor sobe com depuração desligada e recusa endereços fora de `DJANGO_ALLOWED_HOSTS`.
- [ ] Nenhuma chave secreta aparece no código versionado.
- [ ] `pip install -r requirements.txt` funciona num ambiente limpo (arquivo em UTF-8).
- [ ] O fuso é `America/Sao_Paulo`: um pagamento marcado às 22h (Brasília) recebe a data do próprio dia.
- [ ] `venv/` e `db.sqlite3` não aparecem em `git status` nem em `git ls-files`.
- [ ] Os testes existentes do backend continuam passando.
