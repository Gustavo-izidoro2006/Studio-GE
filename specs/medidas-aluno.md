# Spec — Medidas do aluno

## Contexto
Cada avaliação física do aluno gera um novo registro de medidas (histórico), não sobrescreve o anterior.

## Modelo de dados (Medida)
| Campo | Tipo | Obrigatório |
|---|---|---|
| aluno_id | referência (FK) | sim |
| data_avaliacao | data | sim |
| peso | número (kg) | não |
| altura | número (m) | não |
| braco | número (cm) | não |
| abdomen | número (cm) | não |
| torax | número (cm) | não |
| cintura | número (cm) | não |
| quadril | número (cm) | não |
| perna | número (cm) | não |
| suprailiaca | número (mm) | não |
| subescapular | número (mm) | não |
| panturrilha | número (mm) | não |
| triceps | número (mm) | não |

## Regra de cálculo
`imc = peso / (altura * altura)` — calculado automaticamente, exibido com 2 casas decimais. Não é um campo digitável.

## Funcionalidade
- Registrar nova medida para um aluno
- Listar histórico de medidas do aluno (mais recente primeiro)
- Exibir IMC calculado em destaque na tela de detalhe

## Critérios de aceite
- [ ] IMC recalcula automaticamente sempre que peso ou altura mudam
- [ ] Campos não preenchidos aparecem como "Vazio" na tela (não como zero)
- [ ] Uma medida sem peso ou sem altura não calcula/exibe o IMC
