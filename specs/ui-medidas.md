# Spec — UI tela de medidas do aluno

## Layout
- Header com seta de voltar + título "Medidas"
- Nome do aluno em destaque (título grande) + data da última avaliação
- Card de destaque no topo com o IMC calculado (fundo amarelo claro)
- Lista de campos abaixo, um por linha: ícone + nome do campo + valor (ou "Vazio" em cinza, se não preenchido)

## Campos exibidos (nesta ordem)
Nascimento, Peso, Altura, Braço, Abdômen, Tórax, Cintura, Quadril, Perna, Suprailíaca, Subescapular, Panturrilha, Tríceps

## Critérios de aceite
- [ ] O card de IMC nunca é editável diretamente — é sempre calculado
- [ ] Campos sem valor mostram "Vazio", nunca "0" ou espaço em branco
- [ ] A lista é rolável se não couber na tela
