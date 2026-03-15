# Parser

## Papel do parser

O parser converte `tasks.md` em estrutura JSON interna e depois reconstrui markdown sem perder consistencia.

## Requisitos

- preservar round-trip
- preservar metadata inline
- suportar subtarefas
- respeitar status de backlog e board

## Campos relevantes

- `status`
- `description`
- `priority`
- `labels`
- `cardType`
- `assignee`

## Regra critica

Se o parser mudar, o formato do `tasks.md` precisa continuar legivel e estavel para:

- app
- VS Code
- agentes de IA
- sync remoto
