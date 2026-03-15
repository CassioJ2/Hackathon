# Produto

## O que e o CodeSprint

CodeSprint e um app desktop em Electron com interface React para organizar trabalho tecnico em cima de um repositorio GitHub real.

O produto usa:

- `tasks.md` como fonte de verdade das tarefas
- uma branch dedicada `tasks` para sincronizacao de planejamento
- um fluxo local-first para edicao e revisao
- backlog e board como visualizacoes da mesma base de dados

## Principio central

O backlog nao deve ficar separado do repositorio.

Por isso, o produto trata o arquivo `tasks.md` como uma camada de planejamento versionada, editavel tanto pelo app quanto por ferramentas externas como VS Code e agentes de IA.

## Modelo mental

Existe um unico conjunto de tasks.

Esse conjunto pode ser visto de duas formas:

- `Backlog`: tasks com `status: "backlog"`
- `Board`: tasks com status de execucao, como `pending`, `in_progress` e `done`

Backlog e board nao sao estruturas separadas. Sao filtros sobre o mesmo modelo.

## Invariantes de produto

1. `tasks.md` continua sendo a fonte de verdade funcional.
2. backlog continua sendo `status: "backlog"`.
3. board continua sendo derivado dos outros status.
4. o usuario pode editar `tasks.md` com o app aberto.
5. o app nunca deve sobrescrever trabalho local silenciosamente.
