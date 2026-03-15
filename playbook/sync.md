# Sync

## Branch dedicada

Nome da branch:

- `tasks`

Finalidade:

- armazenar apenas os arquivos de planejamento
- evitar poluir a `main` com commits constantes de tarefas
- separar codigo do produto e camada de planejamento

## Arquivos sincronizados na branch `tasks`

- `tasks.md`
- `playbook/README.md`
- `playbook/product.md`
- `playbook/architecture.md`
- `playbook/data-model.md`
- `playbook/sync.md`
- `playbook/ui.md`
- `playbook/playbooks.md`
- `playbook/ipc.md`
- `playbook/parser.md`
- `playbook/mcp.md`

## Fluxos suportados

- `tasks:cache`: salva localmente
- `tasks:save`: envia para GitHub
- `tasks:pull`: busca remoto
- `tasks:external-update`: remoto mudou e pode ser aplicado
- `tasks:remote-conflict`: remoto mudou mas ha alteracoes locais
- `tasks:local-file-update`: arquivo local mudou por fora
- `tasks:local-file-conflict`: arquivo local mudou por fora mas ha alteracoes locais

## Regras de conflito

Quando existir concorrencia entre local e remoto:

- nao sobrescrever silenciosamente
- oferecer manter local
- oferecer carregar remoto
- oferecer mesclar

## Regras de merge

O merge atual deve:

- preservar o que foi editado localmente
- adicionar tasks remotas novas
- adicionar subtarefas remotas ausentes
- manter labels relevantes de ambos os lados

Se esse merge evoluir, a prioridade continua sendo previsibilidade, nao automacao opaca.
