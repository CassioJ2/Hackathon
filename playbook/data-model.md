# Modelo de Dados

## Fonte de verdade

O estado funcional das tarefas e o conteudo de `tasks.md`.

Durante o uso do app:

- o app trabalha primeiro no estado local
- persiste localmente
- sincroniza com a branch `tasks` quando necessario

## Formato esperado de task

Cada task pode incluir:

- `id`
- `title`
- `status`
- `description`
- `priority`
- `labels`
- `cardType`
- `assignee`
- `subtasks`

Status suportados:

- `backlog`
- `pending`
- `in_progress`
- `done`

## Exemplo

```md
- [ ] Melhorar sync remoto <!--meta:{"status":"backlog","description":"Criar fluxo seguro de pull e merge para tasks.","priority":"high","labels":["sync","github"],"cardType":"feature","assignee":"CassioJ2"}-->
  - [ ] Adicionar botao de puxar remoto
  - [ ] Exibir conflito quando houver dirty local
  - [ ] Permitir mesclar antes do sync
```

## Regras de atualizacao

Quando um agente alterar `tasks.md`, ele deve:

1. preservar o que ja existe quando possivel
2. atualizar apenas o necessario
3. manter descricoes curtas e acionaveis
4. evitar tarefas gigantes sem subtarefas
5. adicionar trabalho novo no backlog quando fizer sentido
6. marcar progresso de forma incremental

## Parser

O parser:

- le markdown
- extrai metadata inline
- converte para JSON interno
- permite round-trip de volta para markdown

Qualquer alteracao na estrutura do arquivo precisa respeitar esse round-trip.
